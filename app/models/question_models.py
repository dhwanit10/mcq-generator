from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

class MCQQuestion(BaseModel):
    question: str = Field(..., description="The multiple-choice question text")
    options: List[str] = Field(..., description="Exactly four choices/options for the question")
    correct_option: int = Field(..., description="0-indexed position of the correct answer (0, 1, 2, or 3)")
    explanation: str = Field(..., description="Concise explanation justifying the correct answer based on context")
    difficulty: str = Field("medium", description="Difficulty level requested (e.g., easy, medium, hard)")
    bloom_level: str = Field("apply", description="Bloom's taxonomy level requested")
    source_reference: Optional[str] = Field(None, description="Page number or section reference from source PDF")

    @field_validator("options")
    @classmethod
    def validate_options_length(cls, v: List[str]) -> List[str]:
        if len(v) != 4:
            raise ValueError(f"MCQ must have exactly 4 options, got {len(v)}")
        cleaned = [opt.strip() for opt in v]
        if len(set(cleaned)) < len(cleaned):
            raise ValueError("MCQ options must be distinct/unique")
        if any(len(opt) == 0 for opt in cleaned):
            raise ValueError("MCQ options cannot be empty strings")
        return cleaned

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: int) -> int:
        if v not in (0, 1, 2, 3):
            raise ValueError(f"correct_option must be 0, 1, 2, or 3, got {v}")
        return v

    @field_validator("question")
    @classmethod
    def validate_question_text(cls, v: str) -> str:
        text = v.strip()
        if len(text) < 10:
            raise ValueError("Question text is too short")
        return text


class MCQBatchResponse(BaseModel):
    questions: List[MCQQuestion] = Field(..., description="List of generated MCQ objects in batch")


class ValidationResult(BaseModel):
    is_valid: bool
    reason: Optional[str] = None
    quality_score: float = 1.0
