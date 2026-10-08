from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

class GenerationRequest(BaseModel):
    number_of_questions: int = Field(..., ge=1, le=500, description="Total number of valid questions requested")
    difficulty: str = Field("medium", description="Question difficulty: easy, medium, hard")
    bloom_level: str = Field("apply", description="Bloom's Taxonomy level: remember, understand, apply, analyze, evaluate, create")
    question_type: str = Field("mcq", description="Question format (mcq)")
    
    # Optional runtime overrides
    questions_per_batch: Optional[int] = Field(None, ge=1, le=50, description="Override default QUESTIONS_PER_BATCH")
    max_concurrent_requests: Optional[int] = Field(None, ge=1, le=50, description="Override default MAX_CONCURRENT_REQUESTS")
    generation_mode: Optional[str] = Field(None, description="Override generation mode: parallel or sequential")


class JobResponse(BaseModel):
    job_id: str
    status: str
    total_questions: int
    message: Optional[str] = None


class GenerationMetrics(BaseModel):
    job_id: str
    requested_questions: int
    generated_candidates: int = 0
    accepted_questions: int = 0
    rejected_questions: int = 0
    retries: int = 0
    concurrency: int
    batch_size: int
    generation_mode: str
    
    extraction_time_ms: float = 0.0
    prompt_prep_time_ms: float = 0.0
    total_time_ms: float = 0.0
    
    time_to_first_question_ms: Optional[float] = None
    time_to_25_questions_ms: Optional[float] = None
    time_to_50_questions_ms: Optional[float] = None
    time_to_100_questions_ms: Optional[float] = None
    
    batch_latencies_ms: List[float] = []
