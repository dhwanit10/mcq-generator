import pytest
from app.models.question_models import MCQQuestion
from app.services.duplicate_service import DuplicateDetector
from app.services.validation_service import ValidationPipeline

@pytest.mark.asyncio
async def test_deterministic_validation_valid():
    q = MCQQuestion(
        question="What is the speed of light in vacuum?",
        options=["299,792,458 m/s", "150,000,000 m/s", "3,000,000 m/s", "1,000 m/s"],
        correct_option=0,
        explanation="The speed of light in vacuum is approximately 299,792,458 meters per second.",
        difficulty="medium",
        bloom_level="remember",
        source_reference="Page 1"
    )
    detector = DuplicateDetector(similarity_threshold=0.85)
    pipeline = ValidationPipeline(detector)
    res = await pipeline.validate_question(q)
    assert res.is_valid is True

@pytest.mark.asyncio
async def test_duplicate_validation():
    detector = DuplicateDetector(similarity_threshold=0.80)
    pipeline = ValidationPipeline(detector)

    q1 = MCQQuestion(
        question="What is the capital of France and its primary landmarks?",
        options=["Paris", "London", "Berlin", "Madrid"],
        correct_option=0,
        explanation="Paris is the capital of France.",
        difficulty="easy",
        bloom_level="remember"
    )
    
    q2 = MCQQuestion(
        question="What is the capital of France and its major landmarks?",
        options=["Paris", "Rome", "Vienna", "Lisbon"],
        correct_option=0,
        explanation="Paris is France's capital city.",
        difficulty="easy",
        bloom_level="remember"
    )

    res1 = await pipeline.validate_question(q1)
    assert res1.is_valid is True

    # Second question should be flagged as duplicate by TF-IDF / Cosine Similarity
    res2 = await pipeline.validate_question(q2)
    assert res2.is_valid is False
    assert "Duplicate" in res2.reason
