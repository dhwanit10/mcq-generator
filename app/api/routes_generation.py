import uuid
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, status
from app.models.request_models import JobResponse
from app.services.job_service import job_manager
from app.services.generation_service import generation_orchestrator
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["MCQ Generation"])


@router.get("/health")
async def health_check():
    """Health check endpoint returning system status."""
    return {"status": "ok", "service": "high-throughput-mcq-generator"}


@router.post("/generate-mcqs", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_mcqs(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF document containing study material"),
    number_of_questions: int = Form(..., ge=1, le=500, description="Total requested MCQ count"),
    difficulty: str = Form("medium", description="Difficulty level (easy, medium, hard)"),
    bloom_level: str = Form("apply", description="Bloom's taxonomy level"),
    question_type: str = Form("mcq", description="Question format"),
    subject: Optional[str] = Form(None, description="Subject hint for visual prompt (maths, chemistry, physics, biology)"),
    questions_per_batch: Optional[int] = Form(None, description="Optional override for QUESTIONS_PER_BATCH"),
    max_concurrent_requests: Optional[int] = Form(None, description="Optional override for MAX_CONCURRENT_REQUESTS"),
    generation_mode: Optional[str] = Form(None, description="Optional override for GENERATION_MODE ('parallel' or 'sequential')")
):
    """
    Submits a PDF document and generation configuration to initiate asynchronous MCQ generation.
    Returns immediately with a job_id for real-time WebSocket progress tracking.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files (.pdf) are supported.")

    pdf_bytes = await file.read()
    if not pdf_bytes or len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

    job_id = str(uuid.uuid4())[:12]
    eff_concurrency = max_concurrent_requests or settings.MAX_CONCURRENT_REQUESTS
    eff_batch_size = questions_per_batch or settings.QUESTIONS_PER_BATCH
    eff_mode = generation_mode or settings.GENERATION_MODE

    # Initialize job state in memory
    job = await job_manager.create_job(
        job_id=job_id,
        requested_questions=number_of_questions,
        concurrency=eff_concurrency,
        batch_size=eff_batch_size,
        generation_mode=eff_mode
    )

    # Launch background async generation task
    background_tasks.add_task(
        generation_orchestrator.run_generation_job,
        job_id=job_id,
        pdf_bytes=pdf_bytes,
        difficulty=difficulty,
        bloom_level=bloom_level,
        question_type=question_type,
        questions_per_batch=questions_per_batch,
        max_concurrent_requests=max_concurrent_requests,
        generation_mode=generation_mode,
        subject=subject
    )

    logger.info(f"Generation job {job_id} launched for {number_of_questions} questions (mode={eff_mode}, concurrency={eff_concurrency}, batch_size={eff_batch_size}).")

    return JobResponse(
        job_id=job_id,
        status="started",
        total_questions=number_of_questions,
        message=f"Job initialized. Connect to WebSocket /api/v1/ws/generate/{job_id} for realtime question streaming."
    )


@router.post("/mobile/generate-mcqs", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
@router.post("/generate-mcqs-mobile", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_mcqs_mobile(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF document containing study material"),
    number_of_questions: int = Form(..., ge=1, le=500, description="Total requested MCQ count"),
    difficulty: str = Form("medium", description="Difficulty level (easy, medium, hard)"),
    bloom_level: str = Form("apply", description="Bloom's taxonomy level"),
    question_type: str = Form("mcq", description="Question format"),
    subject: Optional[str] = Form(None, description="Subject hint for visual prompt (maths, chemistry, physics, biology)"),
    questions_per_batch: Optional[int] = Form(None, description="Optional override for QUESTIONS_PER_BATCH"),
    max_concurrent_requests: Optional[int] = Form(None, description="Optional override for MAX_CONCURRENT_REQUESTS"),
    generation_mode: Optional[str] = Form(None, description="Optional override for GENERATION_MODE ('parallel' or 'sequential')")
):
    """
    Dedicated Mobile MCQ generation endpoint.
    Uses progressive batch sizes (1, 3, 5, 7, 9, 10...) so mobile clients receive the 1st MCQ
    almost instantly with 0 initial wait time.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files (.pdf) are supported.")

    pdf_bytes = await file.read()
    if not pdf_bytes or len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

    job_id = str(uuid.uuid4())[:12]
    eff_concurrency = max_concurrent_requests or settings.MAX_CONCURRENT_REQUESTS
    eff_mode = generation_mode or settings.GENERATION_MODE

    # In mobile progressive mode, initial batch size starts at 1
    job = await job_manager.create_job(
        job_id=job_id,
        requested_questions=number_of_questions,
        concurrency=eff_concurrency,
        batch_size=1,
        generation_mode=eff_mode
    )

    background_tasks.add_task(
        generation_orchestrator.run_generation_job,
        job_id=job_id,
        pdf_bytes=pdf_bytes,
        difficulty=difficulty,
        bloom_level=bloom_level,
        question_type=question_type,
        questions_per_batch=questions_per_batch,
        max_concurrent_requests=max_concurrent_requests,
        generation_mode=generation_mode,
        subject=subject,
        is_mobile=True
    )

    logger.info(f"[Mobile API] Job {job_id} launched for {number_of_questions} questions with progressive batching (1, 3, 5, 7, 9, 10).")

    return JobResponse(
        job_id=job_id,
        status="started",
        total_questions=number_of_questions,
        message=f"Mobile job initialized with progressive batching (1, 3, 5, 7, 9, 10). Connect to WebSocket /api/v1/ws/generate/{job_id}."
    )


@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Returns current status, accepted question count, and timing metrics for a given job_id."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    return {
        "job_id": job.job_id,
        "status": job.status,
        "error_message": job.error_message,
        "requested_questions": job.requested_questions,
        "accepted_count": len(job.accepted_questions),
        "metrics": job.metrics.model_dump()
    }
