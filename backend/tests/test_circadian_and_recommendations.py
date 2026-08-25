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

    # 1:30 AM late night viewing event
    rec = RawRecord(
        job_id=job_id,
        timestamp=datetime(2026, 8, 25, 1, 30, 0),
        raw_title="Python Async Tutorial",
        record_type=RecordType.VIDEO
    )
    db.add(rec)
    db.commit()

    # Calculate circadian score
    score = ProxyMetricsEngine.calculate_circadian_score([rec])
    assert score == 100.0, f"Expected 100.0 for late night 1:30 AM viewing, got {score}"

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
