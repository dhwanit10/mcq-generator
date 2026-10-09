import logging
from typing import List
from langchain_core.embeddings import Embeddings
from app.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self._embeddings = None

    def get_embeddings(self) -> Embeddings:
        if self._embeddings is not None:
            return self._embeddings

        provider = settings.EMBEDDING_PROVIDER.lower()
        if provider == "fastembed":
            try:
                from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
                logger.info(f"Initializing FastEmbedEmbeddings model '{settings.EMBEDDING_MODEL}'...")
                self._embeddings = FastEmbedEmbeddings(
                    model_name=settings.EMBEDDING_MODEL,
                    batch_size=settings.EMBEDDING_BATCH_SIZE
                )
                return self._embeddings
            except Exception as e:
                logger.error(f"Failed to initialize FastEmbedEmbeddings: {e}")
                raise RuntimeError(f"Embedding initialization error: {e}")
        else:
            # Fallback to FastEmbed
            from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
            self._embeddings = FastEmbedEmbeddings(
                model_name="BAAI/bge-small-en-v1.5",
                batch_size=settings.EMBEDDING_BATCH_SIZE
            )
            return self._embeddings

embedding_service = EmbeddingService()
