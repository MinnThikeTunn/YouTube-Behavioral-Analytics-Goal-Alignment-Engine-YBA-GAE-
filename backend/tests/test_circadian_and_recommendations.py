import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Job, RawRecord, RecordType, ComputedMetric
from app.services.proxy_metrics import ProxyMetricsEngine
from app.services.goal_alignment import RecommendationEngine, GoalAlignmentEngine
from app.api.v1.analytics import build_hourly_heatmap

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_circadian_score_local_time(db_session):
    job_id = "test_circadian_job"
    job = Job(id=job_id, goal_text="Software Engineering")
    db_session.add(job)

    # 1:30 AM late night viewing event
    rec = RawRecord(
        job_id=job_id,
        timestamp=datetime(2026, 8, 25, 1, 30, 0),
        raw_title="Python Async Tutorial",
        record_type=RecordType.VIDEO
    )
    db_session.add(rec)
    db_session.commit()

    # Calculate circadian score
    score = ProxyMetricsEngine.calculate_circadian_score([rec])
    assert score == 100.0, f"Expected 100.0 for late night 1:30 AM viewing, got {score}"


def test_recommendations_auto_generation(db_session):
    job_id = "test_recs_job"
    job = Job(id=job_id, goal_text="Software Engineering & Python")
    db_session.add(job)
    db_session.commit()

    # Generate recommendations
    RecommendationEngine.generate_and_save_recommendations(db_session, job_id, "Software Engineering & Python")
    
    recs = job.recommended_channels
    assert len(recs) > 0, "Recommendations should not be empty"
    
    discovery = [r for r in recs if r.category == "discovery"]
    assert len(discovery) > 0, "Discovery recommendations should be present"
