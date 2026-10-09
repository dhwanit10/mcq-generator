import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Optional

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

    # Vector Store & RAG Configurations
    VECTOR_STORE_PROVIDER: str = "qdrant"
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "study_notes"
    QDRANT_PATH: Optional[str] = "./qdrant_storage"

    EMBEDDING_PROVIDER: str = "fastembed"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_BATCH_SIZE: int = 64

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150

    RETRIEVAL_TOP_K: int = 15
    MAX_RETRIEVAL_CONTEXT_CHARS: int = 30000

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
