from datetime import datetime, timezone
import pytest
from app.db.session import engine, Base, SessionLocal
from app.db.models import Job, RawRecord, RecordType, ComputedMetric
from app.services.proxy_metrics import ProxyMetricsEngine
from app.services.goal_alignment import RecommendationEngine, GoalAlignmentEngine
from app.api.v1.analytics import build_hourly_heatmap

def test_circadian_score_local_time():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    job_id = "test_circadian_job"
    job = Job(id=job_id, goal_text="Software Engineering")
    db.add(job)

    # 12:41 AM (00:41) local time corresponds to current time
    now_utc = datetime.now(timezone.utc)
    now_local = now_utc.astimezone()
    
    rec = RawRecord(
        job_id=job_id,
        timestamp=now_utc.replace(tzinfo=None), # Stored as naive UTC in DB
        raw_title="Python Async Tutorial",
        record_type=RecordType.VIDEO
    )
    db.add(rec)
    db.commit()

    # Calculate circadian score
    score = ProxyMetricsEngine.calculate_circadian_score([rec])
    
    # If the local time hour is between 23 and 5, score should be 100%
    if now_local.hour >= 23 or now_local.hour < 5:
        assert score == 100.0, f"Expected 100.0 for local hour {now_local.hour}, got {score}"

    db.close()

def test_recommendations_auto_generation():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    job_id = "test_recs_job"
    job = Job(id=job_id, goal_text="Software Engineering & Python")
    db.add(job)
    db.commit()

    # Generate recommendations
    RecommendationEngine.generate_and_save_recommendations(db, job_id, "Software Engineering & Python")
    
    recs = job.recommended_channels
    assert len(recs) > 0, "Recommendations should not be empty"
    
    discovery = [r for r in recs if r.category == "discovery"]
    assert len(discovery) > 0, "Discovery recommendations should be present"

    db.close()
