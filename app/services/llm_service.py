import os
import json
import logging
import asyncio
from typing import List, Optional, Dict, Any
from app.config import settings
from app.models.question_models import MCQBatchResponse, MCQQuestion, ValidationResult
from app.prompts.mcq_generation_prompt import build_mcq_system_prompt, build_user_prompt

logger = logging.getLogger(__name__)

# Try importing Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-genai SDK not installed or unavailable.")


class LLMService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY or os.environ.get("GOOGLE_API_KEY", "")
        self.primary_model = settings.MODEL_NAME
        self.fallback_model = settings.FALLBACK_MODEL_NAME
        self.client = None
        
        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")

    async def generate_mcq_batch(
        self,
        difficulty: str,
        bloom_level: str,
        batch_size: int,
        document_content: str,
        batch_index: int = 1,
        total_batches: int = 1
    ) -> List[MCQQuestion]:
        """
        Generates a batch of MCQ questions using Gemini models with fallback support.
        """
        system_prompt = build_mcq_system_prompt()
        user_prompt = build_user_prompt(
            difficulty=difficulty,
            bloom_level=bloom_level,
            batch_size=batch_size,
            document_content=document_content,
            batch_index=batch_index,
            total_batches=total_batches
        )

        # 1. Try Primary Model
        try:
            return await self._call_gemini(
                model_name=self.primary_model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                batch_size=batch_size,
                difficulty=difficulty,
                bloom_level=bloom_level
            )
        except Exception as primary_error:
            logger.warning(f"Primary model ({self.primary_model}) call failed: {primary_error}. Retrying with fallback model ({self.fallback_model})...")

        # 2. Try Fallback Model
        try:
            return await self._call_gemini(
                model_name=self.fallback_model,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                batch_size=batch_size,
                difficulty=difficulty,
                bloom_level=bloom_level
            )
        except Exception as fallback_error:
            logger.error(f"Fallback model ({self.fallback_model}) also failed: {fallback_error}")
            raise RuntimeError(f"LLM Generation failed for primary ({self.primary_model}) and fallback ({self.fallback_model}): {fallback_error}")

    async def _call_gemini(
        self,
        model_name: str,
        system_prompt: str,
        user_prompt: str,
        batch_size: int,
        difficulty: str,
        bloom_level: str
    ) -> List[MCQQuestion]:
        if not self.client:
            # If no API key configured or client failed, raise informative error or mock for dry runs
            if not self.api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is not configured.")
            raise RuntimeError("GenAI client is not initialized.")

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=MCQBatchResponse,
            temperature=0.7
        )

        response = await self.client.aio.models.generate_content(
            model=model_name,
            contents=user_prompt,
            config=config
        )

        if not response.text:
            raise ValueError(f"Empty response from model {model_name}")

        return self._parse_mcq_response(response.text, difficulty, bloom_level)

    def _parse_mcq_response(self, raw_json: str, difficulty: str, bloom_level: str) -> List[MCQQuestion]:
        """Parses and validates LLM JSON response into Pydantic MCQQuestion models."""
        try:
            data = json.loads(raw_json)
        except json.JSONDecodeError as e:
            # Clean markdown code blocks if present
            cleaned = raw_json.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())

        # If data is wrapped in a dict with 'questions' key or is a list directly
        questions_raw = []
        if isinstance(data, dict):
            questions_raw = data.get("questions", [])
            if not questions_raw and "question" in data:
                questions_raw = [data]
        elif isinstance(data, list):
            questions_raw = data

        questions = []
        for item in questions_raw:
            if not isinstance(item, dict):
                continue
            # Ensure default difficulty and bloom_level if not populated by LLM
            if "difficulty" not in item or not item["difficulty"]:
                item["difficulty"] = difficulty
            if "bloom_level" not in item or not item["bloom_level"]:
                item["bloom_level"] = bloom_level

            try:
                mcq = MCQQuestion(**item)
                questions.append(mcq)
            except Exception as val_err:
                logger.debug(f"Question parsing validation error: {val_err} for item {item}")

        return questions

    async def validate_question_quality_llm(self, question: MCQQuestion, document_excerpt: str) -> ValidationResult:
        """
        Optional Layer 4 LLM Quality Validator.
        Checks relevance, distractor quality, ambiguity, and factual grounding.
        """
        if not self.client or not settings.ENABLE_LLM_VALIDATION:
            return ValidationResult(is_valid=True, quality_score=1.0)

        prompt = (
            f"Evaluate this MCQ for factual correctness, grounding in text, clarity, and distractor quality:\n\n"
            f"Question: {question.question}\n"
            f"Options: {question.options}\n"
            f"Correct Index: {question.correct_option}\n"
            f"Explanation: {question.explanation}\n\n"
            f"Context Excerpt:\n{document_excerpt[:2000]}\n\n"
            f"Return JSON: {{\"is_valid\": true/false, \"reason\": \"...\", \"quality_score\": 0.0-1.0}}"
        )

        try:
            response = await self.client.aio.models.generate_content(
                model=self.primary_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            parsed = json.loads(response.text)
            return ValidationResult(
                is_valid=parsed.get("is_valid", True),
                reason=parsed.get("reason"),
                quality_score=float(parsed.get("quality_score", 1.0))
            )
        except Exception as e:
            logger.warning(f"LLM quality validation error: {e}. Defaulting to valid.")
            return ValidationResult(is_valid=True, quality_score=1.0)


llm_service = LLMService()
