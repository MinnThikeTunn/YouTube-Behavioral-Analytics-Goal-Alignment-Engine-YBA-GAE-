import pytest
from datetime import datetime
from app.db.session import SessionLocal, Base, engine
from app.db.models import Job, RawRecord, RecordType, EnrichedVideo
from app.api.v1.analytics import build_hourly_heatmap

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_build_hourly_heatmap_scaling_and_trends(db_session):
    job_id = "test_heatmap_job_123"
    goal_text = "Software Engineering & Python Development"

    # Clean up any existing records
    db_session.query(RawRecord).filter(RawRecord.job_id == job_id).delete()
    db_session.query(Job).filter(Job.id == job_id).delete()
    db_session.commit()

    # Create job
    job = Job(id=job_id, goal_text=goal_text, status="COMPLETED")
    db_session.add(job)

    # Add 10 AM software engineering videos
    rec1 = RawRecord(
        job_id=job_id,
        raw_title="Watched Python Asyncio Tutorial & FastAPI Backend",
        record_type=RecordType.VIDEO,
        video_id="vid_10_1",
        timestamp=datetime(2026, 8, 2, 10, 15, 0)
    )
    rec2 = RawRecord(
        job_id=job_id,
        raw_title="Watched Software Architecture & System Design",
        record_type=RecordType.VIDEO,
        video_id="vid_10_2",
        timestamp=datetime(2026, 8, 2, 10, 45, 0)
    )

    # Add 11 PM entertainment videos
    rec3 = RawRecord(
        job_id=job_id,
        raw_title="Watched Funny Cat Comedies & Pranks 2026",
        record_type=RecordType.VIDEO,
        video_id="vid_23_1",
        timestamp=datetime(2026, 8, 2, 23, 10, 0)
    )

    db_session.add_all([rec1, rec2, rec3])
    db_session.commit()

    heatmap = build_hourly_heatmap(db_session, job_id, goal_text)

    assert len(heatmap) == 24

    hour_10 = heatmap[10]
    hour_23 = heatmap[23]

    assert hour_10.click_count == 2
    assert hour_23.click_count == 1

    # 10 AM (software engineering) alignment should be clearly visible (> 40%)
    assert hour_10.avg_similarity >= 40.0, f"Expected 10 AM alignment >= 40%, got {hour_10.avg_similarity}%"

    # 11 PM (cats) alignment should be low (< 20%)
    assert hour_23.avg_similarity < 20.0, f"Expected 23 PM alignment < 20%, got {hour_23.avg_similarity}%"

    # Clean up
    db_session.query(RawRecord).filter(RawRecord.job_id == job_id).delete()
    db_session.query(Job).filter(Job.id == job_id).delete()
    db_session.commit()
