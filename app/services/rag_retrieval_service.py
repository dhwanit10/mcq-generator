import logging
from typing import List, Dict, Any, Optional
from langchain_core.documents import Document
from app.config import settings
from app.services.vector_store_service import vector_store_service

logger = logging.getLogger(__name__)

class RAGRetrievalService:
    def prepare_rag_context(
        self,
        subject: str,
        topic: Optional[str] = None,
        requested_count: int = 10,
        top_k: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Retrieves relevant document chunks from Qdrant, removes redundant passages,
        and constructs evidence context for parallel generation.
        """
        k = top_k or max(settings.RETRIEVAL_TOP_K, (requested_count // 5) + 5)
        chunks: List[Document] = vector_store_service.retrieve_relevant_chunks(
            subject=subject,
            topic=topic,
            top_k=k
        )

        if not chunks:
            topic_str = f" and topic '{topic}'" if topic else ""
            raise ValueError(f"No indexed study material found for subject '{subject}'{topic_str}. Please upload notes first.")

        # Deduplicate identical chunk content
        seen_texts = set()
        unique_chunks = []
        for doc in chunks:
            text = doc.page_content.strip()
            if text not in seen_texts:
                seen_texts.add(text)
                unique_chunks.append(doc)

        # Build combined evidence context formatted with source references
        context_parts = []
        total_chars = 0
        for doc in unique_chunks:
            page_ref = doc.metadata.get("page_number", 1)
            chunk_idx = doc.metadata.get("chunk_index", 0)
            doc_title = doc.metadata.get("document_title", "Notes")
            
            snippet = f"[Source: {doc_title}, Page {page_ref}, Chunk {chunk_idx}]\n{doc.page_content.strip()}"
            if total_chars + len(snippet) > settings.MAX_RETRIEVAL_CONTEXT_CHARS:
                logger.warning(f"RAG context size limit reached ({total_chars} chars). Truncating remaining retrieved chunks.")
                break

            context_parts.append(snippet)
            total_chars += len(snippet)

        combined_context = "\n\n".join(context_parts)

        return {
            "evidence_context": combined_context,
            "chunks_retrieved": len(unique_chunks),
            "chunk_metadata": [doc.metadata for doc in unique_chunks]
        }


rag_retrieval_service = RAGRetrievalService()
