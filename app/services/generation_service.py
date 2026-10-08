import time
import asyncio
import logging
from typing import List
from app.config import settings
from app.models.question_models import MCQQuestion
from app.services.job_service import MCQJob, job_manager
from app.services.document_service import extract_text_from_pdf, prepare_document_context
from app.services.llm_service import llm_service
from app.services.duplicate_service import DuplicateDetector
from app.services.validation_service import ValidationPipeline

logger = logging.getLogger(__name__)

class GenerationOrchestrator:
    """
    High-Throughput MCQ Generation Orchestrator supporting:
    - Asynchronous parallel batch generation with asyncio.Semaphore concurrency limit
    - Sequential mode for benchmarking
    - Continuous validation pipeline (producer-consumer streaming to WebSockets)
    - Dynamic over-generation and retries until target valid question count is met
    - Detailed latency, milestone, and throughput metrics tracking
    """
    
    async def run_generation_job(
        self,
        job_id: str,
        pdf_bytes: bytes,
        difficulty: str,
        bloom_level: str,
        question_type: str = "mcq",
        questions_per_batch: int = None,
        max_concurrent_requests: int = None,
        generation_mode: str = None
    ):
        job = await job_manager.get_job(job_id)
        if not job:
            logger.error(f"Job {job_id} not found in job manager.")
            return

        batch_size = questions_per_batch or settings.QUESTIONS_PER_BATCH
        concurrency = max_concurrent_requests or settings.MAX_CONCURRENT_REQUESTS
        mode = generation_mode or settings.GENERATION_MODE
        
        job.metrics.batch_size = batch_size
        job.metrics.concurrency = concurrency
        job.metrics.generation_mode = mode
        
        start_time = time.perf_counter()
        
        try:
            # Step 1: Document Text Extraction
            t0 = time.perf_counter()
            raw_text = extract_text_from_pdf(pdf_bytes)
            job.metrics.extraction_time_ms = (time.perf_counter() - t0) * 1000.0

            # Step 2: Context Preparation & Truncation Check
            t1 = time.perf_counter()
            doc_context, _ = prepare_document_context(raw_text, settings.MAX_DOCUMENT_CHARS)
            job.metrics.prompt_prep_time_ms = (time.perf_counter() - t1) * 1000.0

            # Step 3: Setup Validation Pipeline & Deduplication Detector
            duplicate_detector = DuplicateDetector(settings.DUPLICATE_SIMILARITY_THRESHOLD)
            validator = ValidationPipeline(duplicate_detector, doc_context)

            # Announce Generation Started via WebSocket
            job.status = "processing"
            job.publish_event({
                "event": "generation_started",
                "job_id": job_id,
                "total_requested": job.requested_questions,
                "generation_mode": mode,
                "concurrency": concurrency,
                "batch_size": batch_size
            })

            # Calculate total initial batches
            target_count = job.requested_questions
            num_batches = (target_count + batch_size - 1) // batch_size
            batch_sizes = [min(batch_size, target_count - i * batch_size) for i in range(num_batches)]

            # Step 4: Execute Generation according to Mode
            if mode == "parallel":
                await self._generate_parallel(
                    job=job,
                    validator=validator,
                    doc_context=doc_context,
                    difficulty=difficulty,
                    bloom_level=bloom_level,
                    batch_sizes=batch_sizes,
                    concurrency=concurrency,
                    start_time=start_time
                )
            else:
                await self._generate_sequential(
                    job=job,
                    validator=validator,
                    doc_context=doc_context,
                    difficulty=difficulty,
                    bloom_level=bloom_level,
                    batch_sizes=batch_sizes,
                    start_time=start_time
                )

            # Step 5: Over-Generation / Retries if Valid Questions < Target
            retry_count = 0
            while len(job.accepted_questions) < target_count and retry_count < settings.MAX_RETRIES:
                retry_count += 1
                job.metrics.retries = retry_count
                needed = target_count - len(job.accepted_questions)
                logger.info(f"Target count not reached ({len(job.accepted_questions)}/{target_count}). Retrying over-generation attempt {retry_count}/{settings.MAX_RETRIES} for {needed} questions.")

                retry_batch_sizes = [min(batch_size, needed)]
                if mode == "parallel":
                    await self._generate_parallel(
                        job=job,
                        validator=validator,
                        doc_context=doc_context,
                        difficulty=difficulty,
                        bloom_level=bloom_level,
                        batch_sizes=retry_batch_sizes,
                        concurrency=concurrency,
                        start_time=start_time
                    )
                else:
                    await self._generate_sequential(
                        job=job,
                        validator=validator,
                        doc_context=doc_context,
                        difficulty=difficulty,
                        bloom_level=bloom_level,
                        batch_sizes=retry_batch_sizes,
                        start_time=start_time
                    )

            # Step 6: Mark Completion & Metrics
            job.metrics.total_time_ms = (time.perf_counter() - start_time) * 1000.0
            job.status = "completed"

            logger.info(
                f"\n--- GENERATION METRICS ---\n"
                f"Job ID: {job_id}\n"
                f"Requested: {job.requested_questions}\n"
                f"Generated candidates: {job.metrics.generated_candidates}\n"
                f"Accepted: {len(job.accepted_questions)}\n"
                f"Rejected: {job.metrics.rejected_questions}\n"
                f"Retries: {job.metrics.retries}\n"
                f"Mode: {mode}\n"
                f"Concurrency: {concurrency}, Batch Size: {batch_size}\n"
                f"Time to First: {job.metrics.time_to_first_question_ms or 0:.1f}ms\n"
                f"Time to 25: {job.metrics.time_to_25_questions_ms or 0:.1f}ms\n"
                f"Time to 50: {job.metrics.time_to_50_questions_ms or 0:.1f}ms\n"
                f"Time to 100: {job.metrics.time_to_100_questions_ms or 0:.1f}ms\n"
                f"Total Time: {job.metrics.total_time_ms:.1f}ms\n"
                f"--------------------------"
            )

            job.publish_event({
                "event": "completed",
                "job_id": job_id,
                "total_questions": len(job.accepted_questions),
                "metrics": job.metrics.model_dump()
            })

        except Exception as e:
            logger.error(f"Fatal error during generation job {job_id}: {e}", exc_info=True)
            job.status = "error"
            job.error_message = str(e)
            job.publish_event({
                "event": "error",
                "job_id": job_id,
                "message": str(e)
            })

    async def _generate_parallel(
        self,
        job: MCQJob,
        validator: ValidationPipeline,
        doc_context: str,
        difficulty: str,
        bloom_level: str,
        batch_sizes: List[int],
        concurrency: int,
        start_time: float
    ):
        semaphore = asyncio.Semaphore(concurrency)
        total_batches = len(batch_sizes)

        async def worker(idx: int, size: int):
            async with semaphore:
                t0 = time.perf_counter()
                try:
                    candidates = await llm_service.generate_mcq_batch(
                        difficulty=difficulty,
                        bloom_level=bloom_level,
                        batch_size=size,
                        document_content=doc_context,
                        batch_index=idx + 1,
                        total_batches=total_batches
                    )
                    latency = (time.perf_counter() - t0) * 1000.0
                    job.metrics.batch_latencies_ms.append(latency)
                    job.metrics.generated_candidates += len(candidates)
                    
                    # Process & Validate Candidates as soon as batch arrives
                    await self._process_candidates(job, validator, candidates, start_time)
                except Exception as b_err:
                    logger.warning(f"Batch {idx + 1} generation failed: {b_err}")

        tasks = [asyncio.create_task(worker(i, sz)) for i, sz in enumerate(batch_sizes)]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _generate_sequential(
        self,
        job: MCQJob,
        validator: ValidationPipeline,
        doc_context: str,
        difficulty: str,
        bloom_level: str,
        batch_sizes: List[int],
        start_time: float
    ):
        total_batches = len(batch_sizes)
        for i, sz in enumerate(batch_sizes):
            if len(job.accepted_questions) >= job.requested_questions:
                break
            t0 = time.perf_counter()
            try:
                candidates = await llm_service.generate_mcq_batch(
                    difficulty=difficulty,
                    bloom_level=bloom_level,
                    batch_size=sz,
                    document_content=doc_context,
                    batch_index=i + 1,
                    total_batches=total_batches
                )
                latency = (time.perf_counter() - t0) * 1000.0
                job.metrics.batch_latencies_ms.append(latency)
                job.metrics.generated_candidates += len(candidates)

                await self._process_candidates(job, validator, candidates, start_time)
            except Exception as b_err:
                logger.warning(f"Sequential batch {i + 1} failed: {b_err}")

    async def _process_candidates(
        self,
        job: MCQJob,
        validator: ValidationPipeline,
        candidates: List[MCQQuestion],
        start_time: float
    ):
        for candidate in candidates:
            if len(job.accepted_questions) >= job.requested_questions:
                break

            val_res = await validator.validate_question(candidate)
            if val_res.is_valid:
                q_dict = candidate.model_dump()
                job.accepted_questions.append(q_dict)
                job.metrics.accepted_questions = len(job.accepted_questions)

                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                count = len(job.accepted_questions)

                # Milestone timing metrics
                if count == 1 and job.metrics.time_to_first_question_ms is None:
                    job.metrics.time_to_first_question_ms = elapsed_ms
                if count == 25 and job.metrics.time_to_25_questions_ms is None:
                    job.metrics.time_to_25_questions_ms = elapsed_ms
                if count == 50 and job.metrics.time_to_50_questions_ms is None:
                    job.metrics.time_to_50_questions_ms = elapsed_ms
                if count == 100 and job.metrics.time_to_100_questions_ms is None:
                    job.metrics.time_to_100_questions_ms = elapsed_ms

                # Stream question to WebSocket immediately
                job.publish_event({
                    "event": "question",
                    "job_id": job.job_id,
                    "question_number": count,
                    "question": q_dict
                })
            else:
                job.metrics.rejected_questions += 1
                logger.debug(f"Question candidate rejected: {val_res.reason}")


generation_orchestrator = GenerationOrchestrator()
