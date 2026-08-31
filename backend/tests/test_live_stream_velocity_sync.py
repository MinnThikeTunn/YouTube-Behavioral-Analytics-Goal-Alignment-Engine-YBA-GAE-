import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal, engine, Base
from app.api.v1.stream import get_db
from app.services.velocity_engine import VelocityEngine
from app.db.models import RawRecord, RecordType, Job, JobStatus
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_vcog_calculation_short_session_smoothing():
    db = SessionLocal()
    job_id = "test_vcog_smoothing_job"
    db.query(RawRecord).filter(RawRecord.job_id == job_id).delete()
    db.query(Job).filter(Job.id == job_id).delete()
    db.commit()

    # Create 37 records within a 3-minute span (0.05 hours)
    base_time = datetime.utcnow()
    for i in range(37):
        rec = RawRecord(
            job_id=job_id,
            timestamp=base_time + timedelta(seconds=i * 5), # 36 * 5 = 180s (3 mins)
            raw_title=f"Video {i}",
            title_url=f"https://www.youtube.com/watch?v=vid_{i}",
            video_id=f"vid_{i}",
            record_type=RecordType.VIDEO
        )
        db.add(rec)
    db.commit()

    analytics = VelocityEngine.calculate_velocity(db, job_id)
    session = analytics.sessions[0]

    # V_cog should NOT blow up to astronomical 700+ values due to tiny duration division
    # It should be reasonably bounded / normalized (e.g. <= 150.0)
    assert session.v_cog <= 150.0, f"V_cog was {session.v_cog}, expected <= 150.0"
    db.close()

def test_websocket_velocity_broadcast_on_live_stream():
    job_id = "test_live_stream_job"
    with client.websocket_connect("/api/v1/sync/ws/live") as websocket:
        conn_msg = websocket.receive_json()
        assert conn_msg["type"] == "CONNECTED"

        payload = {
            "job_id": job_id,
            "video_id": "live_vid_999",
            "title": "Live Python Tutorial",
            "channel_name": "Tech Channel",
            "watch_seconds": 60,
            "duration_seconds": 600,
            "is_active_tab": True,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "goal_text": "Software Engineering"
        }

        response = client.post("/api/v1/sync/stream", json=payload)
        assert response.status_code == 200

        # Receive broadcasts (WATCH_UPDATE, ALIGNMENT_UPDATE, VELOCITY_UPDATE)
        messages = []
        for _ in range(3):
            messages.append(websocket.receive_json())

        msg_types = [m["type"] for m in messages]
        assert "WATCH_UPDATE" in msg_types
        assert "ALIGNMENT_UPDATE" in msg_types
        assert "VELOCITY_UPDATE" in msg_types

        vel_msg = next(m for m in messages if m["type"] == "VELOCITY_UPDATE")
        assert vel_msg["data"]["job_id"] == job_id
        assert "sessions" in vel_msg["data"]
        assert "fatigue_windows" in vel_msg["data"]
