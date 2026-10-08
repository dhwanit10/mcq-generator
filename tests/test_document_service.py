import fitz
import pytest
from app.services.document_service import extract_text_from_pdf, prepare_document_context

def create_sample_pdf_bytes(num_pages: int = 3) -> bytes:
    doc = fitz.open()
    for i in range(num_pages):
        page = doc.new_page()
        page.insert_text((50, 50), f"Page {i + 1} content about Quantum Computing and Superposition in physics.")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_extract_text_from_pdf():
    pdf_bytes = create_sample_pdf_bytes(num_pages=3)
    text = extract_text_from_pdf(pdf_bytes)
    assert "[Page 1]" in text
    assert "[Page 2]" in text
    assert "[Page 3]" in text
    assert "Quantum Computing" in text

def test_prepare_document_context_truncation():
    sample_text = "A" * 1000
    prepared, is_truncated = prepare_document_context(sample_text, max_chars=500)
    assert is_truncated is True
    assert len(prepared) <= 600
    assert "TRUNCATED" in prepared

def test_prepare_document_context_no_truncation():
    sample_text = "Short text"
    prepared, is_truncated = prepare_document_context(sample_text, max_chars=500)
    assert is_truncated is False
    assert prepared == sample_text
