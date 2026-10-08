import logging
from typing import Tuple, Optional
from app.models.question_models import MCQQuestion, ValidationResult
from app.services.duplicate_service import DuplicateDetector
from app.services.llm_service import llm_service
from app.config import settings

logger = logging.getLogger(__name__)

class ValidationPipeline:
    def __init__(self, duplicate_detector: DuplicateDetector, document_text: str = ""):
        self.duplicate_detector = duplicate_detector
        self.document_text = document_text

    async def validate_question(self, question: MCQQuestion) -> ValidationResult:
        """
        Runs the 4-layer validation pipeline on a single MCQ candidate:
        - Layer 1: Pydantic/Schema Validation
        - Layer 2: Deterministic Logic Checks
        - Layer 3: Semantic Deduplication Check
        - Layer 4: Optional LLM Quality Validator
        """
        # Layer 1: Schema Validation (Already enforced by Pydantic instantiation)
        if not isinstance(question, MCQQuestion):
            return ValidationResult(is_valid=False, reason="Failed Layer 1: Not a valid MCQQuestion schema instance.")

        # Layer 2: Deterministic Validation
        l2_valid, l2_reason = self._validate_deterministic(question)
        if not l2_valid:
            return ValidationResult(is_valid=False, reason=f"Failed Layer 2 (Deterministic): {l2_reason}")

        # Layer 3: Semantic Deduplication
        if self.duplicate_detector.is_duplicate(question.question):
            return ValidationResult(is_valid=False, reason="Failed Layer 3: Duplicate or highly similar question already accepted.")

        # Layer 4: Optional LLM Quality Validator
        if settings.ENABLE_LLM_VALIDATION and llm_service.client:
            llm_result = await llm_service.validate_question_quality_llm(question, self.document_text)
            if not llm_result.is_valid:
                return ValidationResult(is_valid=False, reason=f"Failed Layer 4 (LLM Validator): {llm_result.reason}")

        # If all layers pass, accept and record question in deduplication bank
        self.duplicate_detector.add_question(question.question)
        return ValidationResult(is_valid=True, quality_score=1.0)

    def _validate_deterministic(self, q: MCQQuestion) -> Tuple[bool, Optional[str]]:
        """Layer 2: Checks options integrity, question length, distractor quality, and correct option bounds."""
        if len(q.question.strip()) < 10:
            return False, "Question text is too short (< 10 chars)"
        if len(q.question.strip()) > 1000:
            return False, "Question text is excessively long (> 1000 chars)"

        if len(q.options) != 4:
            return False, f"Expected 4 options, got {len(q.options)}"

        unique_options = set(opt.strip().lower() for opt in q.options)
        if len(unique_options) < 4:
            return False, "Options contain duplicates or empty values"

        if q.correct_option not in (0, 1, 2, 3):
            return False, f"Invalid correct_option index: {q.correct_option}"

        # Ensure correct option is valid text
        correct_text = q.options[q.correct_option].strip()
        if not correct_text:
            return False, "Correct option text is empty"

        return True, None
