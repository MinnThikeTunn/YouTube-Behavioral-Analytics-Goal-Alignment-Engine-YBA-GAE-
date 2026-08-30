from fastapi.testclient import TestClient
from app.db.session import engine, Base, SessionLocal
from app.main import app
from app.db.models import Job, DAGNode

client = TestClient(app)

def test_dag_engine_endpoints():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    
    # Create a job
    job = Job(id="job_test_123", goal_text="Learn Python Backend")
    db.add(job)
    db.commit()
    
    # 1. POST /api/v1/taxonomy/dag to build DAG
    response = client.post("/api/v1/taxonomy/dag", json={"job_id": "job_test_123"})
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == "job_test_123"
    assert len(data["nodes"]) > 0 # Should have at least one root node
    
    root_node = data["nodes"][0]
    assert "Learn Python Backend" in root_node["title"]
    assert len(root_node["children"]) >= 2 # Should have sub-goal nodes
    
    # 2. GET /api/v1/taxonomy/{job_id}
    response = client.get("/api/v1/taxonomy/job_test_123")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) > 0
    assert data["nodes"][0]["title"] == root_node["title"]
    
    db.close()

def test_velocity_endpoints():
    from datetime import datetime, timedelta
    from app.db.models import RawRecord, RecordType
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    job = Job(id="job_vel_1", goal_text="Test Velocity")
    db.add(job)
    db.commit()
    
    # Add some records
    base_time = datetime.utcnow()
    for i in range(10):
        rec = RawRecord(
            job_id="job_vel_1",
            timestamp=base_time + timedelta(minutes=i*2),
            raw_title=f"Video {i}",
            record_type=RecordType.VIDEO
        )
        db.add(rec)
    
    db.commit()
    
    response = client.get("/api/v1/analytics/job_vel_1/velocity")
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == "job_vel_1"
    assert "sessions" in data
    assert "fatigue_windows" in data
    assert len(data["sessions"]) > 0
    
    db.close()

def test_cohort_endpoint():
    from app.db.models import ComputedMetric
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    job = Job(id="job_cohort_1", goal_text="Test Cohort")
    db.add(job)
    
    metric = ComputedMetric(job_id="job_cohort_1", focus_ratio=80.0, median_completion_prob=0.8, session_density=5.0, circadian_score=10.0, window_period="7d")
    db.add(metric)
    db.commit()
    
    response = client.get("/api/v1/analytics/job_cohort_1/cohort")
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == "job_cohort_1"
    assert "benchmark" in data
    assert "insights" in data
    assert data["benchmark"]["percentile_rank"] == 95.0
    assert data["benchmark"]["cohort_tier"] == "Top 10% Test Cohort"
    
    db.close()
