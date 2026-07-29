import pytest
import io
import json
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import engine, Base

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def test_upload_watch_history_success():
    sample_data = [
        {
            "header": "YouTube",
            "title": "Watched Python Programming for Beginners",
            "titleUrl": "https://www.youtube.com/watch?v=rfscVqOAgA4",
            "time": "2026-07-26T10:00:00.000Z"
        }
    ]
    file_bytes = json.dumps(sample_data).encode("utf-8")
    
    response = client.post(
        "/api/v1/upload",
        files={"file": ("watch-history.json", io.BytesIO(file_bytes), "application/json")},
        data={"goal_text": "Software Engineering"}
    )
    
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "QUEUED"
    
    # Test polling endpoint
    job_id = data["job_id"]
    status_response = client.get(f"/api/v1/jobs/{job_id}/status")
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["job_id"] == job_id
    assert status_data["status"] in ["QUEUED", "PROCESSING", "COMPLETED"]

def test_upload_invalid_file_format():
    response = client.post(
        "/api/v1/upload",
        files={"file": ("invalid.txt", io.BytesIO(b"invalid text"), "text/plain")},
        data={"goal_text": "Software Engineering"}
    )
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]
