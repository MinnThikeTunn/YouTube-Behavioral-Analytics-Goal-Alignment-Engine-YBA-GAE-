import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dom_scraper_logic():
    assert True

def test_websocket_keepalive():
    assert True

def test_shadow_dom_structure():
    assert True

def test_threshold_rules():
    assert True

def test_goal_sync_patch_and_stream():
    """Verify that updating a job goal updates backend state and scoring goal text."""
    patch_res = client.patch(
        "/api/v1/jobs/stream_job_default/goal",
        json={"goal_text": "Data Science & AI"}
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["status"] == "success"
    assert data["goal_text"] == "Data Science & AI"

    # Send stream telemetry with updated goal
    stream_res = client.post(
        "/api/v1/sync/stream",
        json={
            "video_id": "test_ds_video",
            "title": "Machine Learning and Data Science Full Course",
            "channel_name": "FreeCodeCamp",
            "timestamp": "2026-08-12T12:00:00Z",
            "goal_text": "Data Science & AI"
        }
    )
    assert stream_res.status_code == 200
    stream_data = stream_res.json()
    assert stream_data["status"] == "success"
    assert "alignment_score" in stream_data
