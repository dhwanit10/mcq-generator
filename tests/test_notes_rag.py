import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_sample_physics_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (50, 50),
        "Physics Chapter 1: Kinematics and Motion in One Dimension.\n"
        "Formula for velocity: v = u + at.\n"
        "Formula for displacement: s = ut + 0.5 * a * t^2.\n"
        "Acceleration is defined as the rate of change of velocity over time."
    )
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_notes_upload_invalid_subject():
    pdf_bytes = create_sample_physics_pdf()
    response = client.post(
        "/api/v1/notes/upload",
        files={"file": ("physics.pdf", pdf_bytes, "application/pdf")},
        data={"subject": "invalid_subject", "topic": "motion"}
    )
    assert response.status_code == 400
    assert "Invalid subject" in response.json()["detail"]

def test_notes_upload_valid_pdf():
    pdf_bytes = create_sample_physics_pdf()
    response = client.post(
        "/api/v1/notes/upload",
        files={"file": ("physics_notes.pdf", pdf_bytes, "application/pdf")},
        data={
            "subject": "physics",
            "topic": "projectile_motion",
            "document_title": "Physics Chapter Notes"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] in ("indexed", "already_indexed")
    assert data["subject"] == "physics"
    assert data["topic"] == "projectile_motion"

def test_notes_upload_idempotent_duplicate():
    pdf_bytes = create_sample_physics_pdf()
    # First upload
    client.post(
        "/api/v1/notes/upload",
        files={"file": ("physics_notes.pdf", pdf_bytes, "application/pdf")},
        data={"subject": "physics", "topic": "projectile_motion"}
    )
    # Second identical upload
    response = client.post(
        "/api/v1/notes/upload",
        files={"file": ("physics_notes.pdf", pdf_bytes, "application/pdf")},
        data={"subject": "physics", "topic": "projectile_motion"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "already_indexed"

def test_generate_mcqs_from_notes():
    # Guarantee material is indexed first
    pdf_bytes = create_sample_physics_pdf()
    client.post(
        "/api/v1/notes/upload",
        files={"file": ("physics_notes.pdf", pdf_bytes, "application/pdf")},
        data={"subject": "physics", "topic": "projectile_motion"}
    )

    req_payload = {
        "subject": "physics",
        "topic": "projectile_motion",
        "number_of_questions": 3,
        "difficulty": "medium",
        "bloom_level": "apply",
        "question_type": "mcq"
    }

    response = client.post("/api/v1/generate-mcqs-from-notes", json=req_payload)
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "started"
    assert data["total_requested"] == 3
    assert "/api/v1/ws/generate/" in data["websocket_path"]
