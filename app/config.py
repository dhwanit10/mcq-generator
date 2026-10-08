import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    LLM_PROVIDER: str = "gemini"
    GOOGLE_API_KEY: str = ""
    MODEL_NAME: str = "gemini-1.5-flash"
    FALLBACK_MODEL_NAME: str = "gemini-2.5-flash"

    MAX_CONCURRENT_REQUESTS: int = 5
    QUESTIONS_PER_BATCH: int = 10
    MAX_RETRIES: int = 5
    GENERATION_MODE: Literal["parallel", "sequential"] = "parallel"

    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.85
    ENABLE_LLM_VALIDATION: bool = False

    MAX_DOCUMENT_CHARS: int = 100000

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
