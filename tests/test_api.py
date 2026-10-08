import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_sample_pdf_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Sample study text about Python programming, asyncio concurrency, and REST APIs.")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_generate_mcqs_endpoint_validation():
    response = client.post(
        "/api/v1/generate-mcqs",
        files={"file": ("test.txt", b"plain text content", "text/plain")},
        data={"number_of_questions": "5", "difficulty": "medium", "bloom_level": "apply"}
    )
    assert response.status_code == 400
    assert "Only PDF files" in response.json()["detail"]

def test_generate_mcqs_valid_pdf_submission():
    pdf_bytes = create_sample_pdf_bytes()
    response = client.post(
        "/api/v1/generate-mcqs",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={
            "number_of_questions": "5",
            "difficulty": "medium",
            "bloom_level": "apply",
            "generation_mode": "sequential"
        }
    )
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "started"
    assert data["total_questions"] == 5

    job_id = data["job_id"]
    job_resp = client.get(f"/api/v1/job/{job_id}")
    assert job_resp.status_code == 200
    assert job_resp.json()["job_id"] == job_id

def test_websocket_streaming():
    pdf_bytes = create_sample_pdf_bytes()
    post_res = client.post(
        "/api/v1/generate-mcqs",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={"number_of_questions": "2", "difficulty": "easy", "bloom_level": "remember"}
    )
    assert post_res.status_code == 202
    job_id = post_res.json()["job_id"]

    with client.websocket_connect(f"/api/v1/ws/generate/{job_id}") as websocket:
        first_event = websocket.receive_json()
        assert "event" in first_event
        assert first_event["job_id"] == job_id
