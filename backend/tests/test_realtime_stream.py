import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal, engine, Base
from app.api.v1.stream import get_db

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_stream_endpoint():
    payload = {
        "video_id": "test_video_123",
        "title": "Learn Machine Learning",
        "channel_name": "ML Guru",
        "watch_seconds": 120,
        "duration_seconds": 600,
        "is_active_tab": True,
        "timestamp": "2026-08-11T20:00:00Z",
        "goal_text": "I want to learn machine learning and AI"
    }
    
    response = client.post("/api/v1/sync/stream", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["video_id"] == "test_video_123"
    assert "alignment_score" in data
    assert "classification" in data
    assert data["status"] == "success"

def test_websocket_broadcaster_connection():
    with client.websocket_connect("/api/v1/sync/ws/live") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "CONNECTED"
        assert data["message"] == "WebSocket Broadcaster Hub connected"

def test_websocket_realtime_broadcast_on_stream_post():
    with client.websocket_connect("/api/v1/sync/ws/live") as websocket:
        # First message is connection confirmation
        data = websocket.receive_json()
        assert data["type"] == "CONNECTED"

        payload = {
            "video_id": "test_ws_video_456",
            "title": "React vs Vue",
            "channel_name": "Frontend Dev",
            "watch_seconds": 300,
            "duration_seconds": 1200,
            "is_active_tab": True,
            "timestamp": "2026-08-11T20:05:00Z",
            "goal_text": "I want to become a frontend master"
        }
        
        response = client.post("/api/v1/sync/stream", json=payload)
        assert response.status_code == 200
        
        # Now we should receive a watch update broadcast
        broadcast_data = websocket.receive_json()
        assert broadcast_data["type"] == "WATCH_UPDATE"
        assert broadcast_data["data"]["video_id"] == "test_ws_video_456"
        assert broadcast_data["data"]["title"] == "React vs Vue"
        assert "alignment_score" in broadcast_data["data"]
        assert "classification" in broadcast_data["data"]

def test_stream_job_default_auto_creation_analytics_and_goal():
    # Test GET analytics for stream_job_default auto-creates job (returns 200)
    response = client.get("/api/v1/analytics/stream_job_default")
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == "stream_job_default"
    assert "goal_text" in data

    # Test PATCH goal for stream_job_default auto-creates / updates goal (returns 200)
    patch_res = client.patch("/api/v1/jobs/stream_job_default/goal", json={"goal_text": "Updated Data Science Goal"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "success"
    assert patch_res.json()["goal_text"] == "Updated Data Science Goal"

