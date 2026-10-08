import io
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts text page by page from a PDF file using PyMuPDF (fitz) or pypdf as fallback.
    Preserves page boundaries so source references can point to specific pages.
    """
    page_texts = []
    
    # Try PyMuPDF (fitz) first
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for i, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                page_texts.append(f"[Page {i + 1}]\n{text}")
        doc.close()
        if page_texts:
            logger.info(f"PyMuPDF successfully extracted {len(page_texts)} pages.")
            return "\n\n".join(page_texts)
    except Exception as e:
        logger.warning(f"PyMuPDF text extraction failed or not available: {e}. Trying pypdf fallback.")

    # Fallback to pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                page_texts.append(f"[Page {i + 1}]\n{text.strip()}")
        if page_texts:
            logger.info(f"pypdf successfully extracted {len(page_texts)} pages.")
            return "\n\n".join(page_texts)
    except Exception as e:
        logger.error(f"pypdf text extraction failed: {e}")
        raise ValueError(f"Could not extract text from PDF: {str(e)}")

    if not page_texts:
        raise ValueError("The uploaded PDF contains no extractable text.")
        
    return "\n\n".join(page_texts)


def prepare_document_context(text: str, max_chars: int) -> Tuple[str, bool]:
    """
    Ensures document context stays within maximum character limits.
    Returns (prepared_text, is_truncated).
    """
    if len(text) <= max_chars:
        return text, False

    logger.warning(f"Document text length ({len(text)} chars) exceeds MAX_DOCUMENT_CHARS ({max_chars}). Intelligently truncating context.")
    
    # Retain start and end portions if large, or truncate cleanly at page boundary
    half = max_chars // 2
    head = text[:half]
    tail = text[-half:]
    
    truncated_text = f"{head}\n\n[... TRUNCATED MIDDLE CONTENT DUE TO CONTEXT LIMIT ...]\n\n{tail}"
    return truncated_text, True
