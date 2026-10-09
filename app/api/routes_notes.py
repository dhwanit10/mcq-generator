import uuid
import hashlib
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, status
from app.models.request_models import UploadNotesResponse, GenerateFromNotesRequest, GenerateFromNotesResponse
from app.services.document_service import extract_text_from_pdf
from app.services.vector_store_service import vector_store_service
from app.services.job_service import job_manager
from app.services.generation_service import generation_orchestrator
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Study Notes & RAG Generation"])


@router.post("/notes/upload", response_model=UploadNotesResponse, status_code=status.HTTP_201_CREATED)
async def upload_notes(
    file: UploadFile = File(..., description="PDF study notes or textbook chapter"),
    subject: str = Form(..., description="Subject name (maths, chemistry, physics, biology)"),
    topic: Optional[str] = Form(None, description="Optional topic label"),
    document_title: Optional[str] = Form(None, description="Optional human-readable document title")
):
    """
    Uploads a PDF study document, extracts content page by page, generates vector embeddings,
    and stores chunks persistently in Qdrant.
    """
    s_clean = subject.strip().lower()
    allowed_subjects = {"maths", "chemistry", "physics", "biology"}
    if s_clean not in allowed_subjects:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid subject '{subject}'. Allowed subjects: {list(allowed_subjects)}"
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files (.pdf) are supported.")

    pdf_bytes = await file.read()
    if not pdf_bytes or len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

    # Step 1: Extract Text
    try:
        extracted_text = extract_text_from_pdf(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Step 2: Content Hash & Idempotency Check
    content_hash = hashlib.sha256(pdf_bytes).hexdigest()
    doc_title = document_title.strip() if document_title and document_title.strip() else file.filename
    topic_clean = topic.strip().lower() if topic and topic.strip() else ""

    if vector_store_service.is_document_indexed(content_hash, s_clean, topic_clean):
        logger.info(f"Document '{doc_title}' with hash {content_hash[:8]} is already indexed.")
        return UploadNotesResponse(
            status="already_indexed",
            document_id=f"doc_{content_hash[:12]}",
            document_title=doc_title,
            subject=s_clean,
            topic=topic_clean,
            total_pages=extracted_text.count("[Page "),
            total_chunks=0,
            message="Document has already been indexed in Qdrant vector store."
        )

    # Step 3: Chunking & Qdrant Vector Ingestion
    doc_id = f"doc_{str(uuid.uuid4())[:8]}"
    result = vector_store_service.index_extracted_text(
        extracted_text=extracted_text,
        document_id=doc_id,
        document_title=doc_title,
        subject=s_clean,
        topic=topic_clean,
        content_hash=content_hash
    )

    return UploadNotesResponse(
        status="indexed",
        document_id=result["document_id"],
        document_title=result["document_title"],
        subject=result["subject"],
        topic=result["topic"],
        total_pages=result["total_pages"],
        total_chunks=result["total_chunks"],
        message=result["message"]
    )


@router.post("/generate-mcqs-from-notes", response_model=GenerateFromNotesResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_mcqs_from_notes(
    req: GenerateFromNotesRequest,
    background_tasks: BackgroundTasks
):
    """
    Initiates asynchronous parallel MCQ generation using RAG retrieval from Qdrant vector store
    based on subject and optional topic metadata filters.
    """
    job_id = str(uuid.uuid4())[:12]
    eff_concurrency = req.max_concurrent_requests or settings.MAX_CONCURRENT_REQUESTS
    eff_batch_size = req.questions_per_batch or settings.QUESTIONS_PER_BATCH
    eff_mode = req.generation_mode or settings.GENERATION_MODE

    # Initialize job state in memory
    job = await job_manager.create_job(
        job_id=job_id,
        requested_questions=req.number_of_questions,
        concurrency=eff_concurrency,
        batch_size=eff_batch_size,
        generation_mode=eff_mode
    )

    # Launch background RAG generation task
    background_tasks.add_task(
        generation_orchestrator.run_rag_generation_job,
        job_id=job_id,
        subject=req.subject,
        topic=req.topic,
        difficulty=req.difficulty,
        bloom_level=req.bloom_level,
        question_type=req.question_type,
        questions_per_batch=req.questions_per_batch,
        max_concurrent_requests=req.max_concurrent_requests,
        generation_mode=req.generation_mode
    )

    ws_path = f"/api/v1/ws/generate/{job_id}"
    logger.info(f"RAG MCQ Generation job {job_id} launched for subject='{req.subject}', topic='{req.topic}' ({req.number_of_questions} questions).")

    return GenerateFromNotesResponse(
        job_id=job_id,
        status="started",
        total_requested=req.number_of_questions,
        websocket_path=ws_path
    )
