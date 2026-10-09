import logging
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_generation import router as generation_router, generate_mcqs
from app.api.routes_websocket import router as websocket_router
from app.api.routes_notes import router as notes_router
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger("mcq_generator")

app = FastAPI(
    title="High-Throughput AI MCQ Generation System Backend with RAG",
    description="Backend API demonstrating parallel LLM generation and Qdrant-backed RAG for high-volume MCQ synthesis.",
    version="2.0.0"
)

# Enable CORS for flexible backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(generation_router)
app.include_router(websocket_router)
app.include_router(notes_router)

# Root level alias POST /generate-mcqs as requested in initial spec
@app.post("/generate-mcqs", tags=["MCQ Generation"])
async def root_generate_mcqs_alias(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    number_of_questions: int = Form(...),
    difficulty: str = Form("medium"),
    bloom_level: str = Form("apply"),
    question_type: str = Form("mcq"),
    questions_per_batch: int = Form(None),
    max_concurrent_requests: int = Form(None),
    generation_mode: str = Form(None)
):
    """Direct alias for POST /api/v1/generate-mcqs."""
    return await generate_mcqs(
        background_tasks=background_tasks,
        file=file,
        number_of_questions=number_of_questions,
        difficulty=difficulty,
        bloom_level=bloom_level,
        question_type=question_type,
        questions_per_batch=questions_per_batch,
        max_concurrent_requests=max_concurrent_requests,
        generation_mode=generation_mode
    )


@app.get("/", tags=["Health"])
async def root_health():
    return {
        "service": "High-Throughput AI MCQ Generation Backend with RAG",
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/health"
    }
