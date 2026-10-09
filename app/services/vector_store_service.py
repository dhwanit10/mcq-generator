import hashlib
import logging
from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class VectorStoreService:
    def __init__(self):
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self._client: Optional[QdrantClient] = None
        self._vector_store: Optional[QdrantVectorStore] = None

    def _get_client(self) -> QdrantClient:
        if self._client is not None:
            return self._client

        if settings.QDRANT_URL:
            logger.info(f"Connecting to Qdrant at URL '{settings.QDRANT_URL}'...")
            self._client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
        else:
            logger.info(f"Connecting to local persistent Qdrant storage at '{settings.QDRANT_PATH}'...")
            self._client = QdrantClient(path=settings.QDRANT_PATH)

        return self._client

    def _ensure_payload_indexes(self, client: QdrantClient) -> None:
        """
        Creates payload indexes on metadata fields so that Qdrant metadata filters
        actually work during similarity_search(). Without these indexes, filtered
        searches silently return 0 results — this was the core backend bug.
        """
        for field_name in ["metadata.subject", "metadata.topic", "metadata.content_hash"]:
            try:
                client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field_name,
                    field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
                )
                logger.info(f"Payload index ensured on '{field_name}'.")
            except Exception as e:
                # Index may already exist — not a fatal error
                logger.debug(f"Payload index on '{field_name}' already exists or skipped: {e}")

    def get_vector_store(self) -> QdrantVectorStore:
        if self._vector_store is not None:
            return self._vector_store

        client = self._get_client()
        embeddings = embedding_service.get_embeddings()

        self._vector_store = QdrantVectorStore(
            client=client,
            collection_name=self.collection_name,
            embedding=embeddings
        )

        # Ensure payload indexes exist if collection already exists
        if client.collection_exists(self.collection_name):
            self._ensure_payload_indexes(client)

        return self._vector_store

    def is_document_indexed(self, content_hash: str, subject: str, topic: Optional[str] = None) -> bool:
        """
        Checks whether a document with the identical content_hash, subject, and topic
        is already indexed in Qdrant.
        """
        try:
            client = self._get_client()
            if not client.collection_exists(self.collection_name):
                return False

            must_conditions = [
                qdrant_models.FieldCondition(
                    key="metadata.content_hash",
                    match=qdrant_models.MatchValue(value=content_hash)
                ),
                qdrant_models.FieldCondition(
                    key="metadata.subject",
                    match=qdrant_models.MatchValue(value=subject)
                )
            ]
            if topic:
                must_conditions.append(
                    qdrant_models.FieldCondition(
                        key="metadata.topic",
                        match=qdrant_models.MatchValue(value=topic)
                    )
                )

            res = client.scroll(
                collection_name=self.collection_name,
                scroll_filter=qdrant_models.Filter(must=must_conditions),
                limit=1
            )
            return len(res[0]) > 0
        except Exception as e:
            logger.warning(f"Error checking if document is indexed: {e}")
            return False

    def index_extracted_text(
        self,
        extracted_text: str,
        document_id: str,
        document_title: str,
        subject: str,
        topic: Optional[str] = None,
        content_hash: str = ""
    ) -> Dict[str, Any]:
        """
        Splits extracted text page by page into semantically useful chunks, attaches
        metadata, and stores embeddings in Qdrant. Ensures payload indexes exist after
        the first ingestion so subsequent filtered retrievals work correctly.
        """
        # Split text into page sections if page markers exist
        pages = extracted_text.split("[Page ")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

        documents_to_index: List[Document] = []
        global_chunk_idx = 0
        total_pages = 0

        if len(pages) > 1:
            for raw_page in pages[1:]:
                try:
                    page_num_str, page_content = raw_page.split("]\n", 1)
                    page_number = int(page_num_str.strip())
                except ValueError:
                    page_number = 1
                    page_content = raw_page

                total_pages = max(total_pages, page_number)
                chunks = splitter.split_text(page_content)

                for c_idx, chunk_text in enumerate(chunks):
                    doc = Document(
                        page_content=chunk_text,
                        metadata={
                            "document_id": document_id,
                            "document_title": document_title,
                            "subject": subject.lower(),
                            "topic": (topic or "").lower(),
                            "page_number": page_number,
                            "chunk_index": global_chunk_idx,
                            "embedding_model": settings.EMBEDDING_MODEL,
                            "content_hash": content_hash
                        }
                    )
                    documents_to_index.append(doc)
                    global_chunk_idx += 1
        else:
            total_pages = 1
            chunks = splitter.split_text(extracted_text)
            for c_idx, chunk_text in enumerate(chunks):
                doc = Document(
                    page_content=chunk_text,
                    metadata={
                        "document_id": document_id,
                        "document_title": document_title,
                        "subject": subject.lower(),
                        "topic": (topic or "").lower(),
                        "page_number": 1,
                        "chunk_index": c_idx,
                        "embedding_model": settings.EMBEDDING_MODEL,
                        "content_hash": content_hash
                    }
                )
                documents_to_index.append(doc)

        vector_store = self.get_vector_store()
        vector_store.add_documents(documents_to_index)

        # Ensure payload indexes are created after first ingestion into a new collection
        client = self._get_client()
        self._ensure_payload_indexes(client)

        logger.info(
            f"Successfully indexed document '{document_title}' "
            f"({len(documents_to_index)} chunks across {total_pages} pages) into Qdrant."
        )

        return {
            "status": "indexed",
            "document_id": document_id,
            "document_title": document_title,
            "subject": subject,
            "topic": topic or "",
            "total_pages": total_pages,
            "total_chunks": len(documents_to_index),
            "message": "Document indexed successfully."
        }

    def retrieve_relevant_chunks(
        self,
        subject: str,
        topic: Optional[str] = None,
        top_k: int = None
    ) -> List[Document]:
        """
        Retrieves relevant document chunks from Qdrant using metadata filters for
        subject and optional topic.
        """
        k = top_k or settings.RETRIEVAL_TOP_K
        vector_store = self.get_vector_store()

        must_filters = [
            qdrant_models.FieldCondition(
                key="metadata.subject",
                match=qdrant_models.MatchValue(value=subject.lower())
            )
        ]

        if topic and topic.strip():
            must_filters.append(
                qdrant_models.FieldCondition(
                    key="metadata.topic",
                    match=qdrant_models.MatchValue(value=topic.lower())
                )
            )

        qdrant_filter = qdrant_models.Filter(must=must_filters)

        # Retrieve documents matching metadata filter
        results = vector_store.similarity_search(
            query=f"Core concepts, definitions, formulas and principles of {subject} {topic or ''}",
            k=k,
            filter=qdrant_filter
        )

        logger.info(
            f"Retrieved {len(results)} relevant chunks from Qdrant for "
            f"subject='{subject}', topic='{topic}'."
        )
        return results


vector_store_service = VectorStoreService()
