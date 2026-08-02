import pytest
import uuid
from datetime import datetime
from app.db.session import SessionLocal, Base, engine
from app.db.models import Job, JobStatus, JobLog
from app.schemas.job import JobStatusResponseDTO, JobLogDTO

TEST_JOB_ID = f"test-log-job-{uuid.uuid4()}"

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

def test_job_log_model_creation_and_relationship(setup_db):
    db = setup_db
    job_id = TEST_JOB_ID
    
    # Create test job
    job = Job(id=job_id, status=JobStatus.PROCESSING, goal_text="Test Log Execution")
    db.add(job)
    db.commit()

    # Add JobLog entries
    log1 = JobLog(
        job_id=job_id,
        stage="INGESTION",
        level="INFO",
        message="Parsed 1,000 watch history entries.",
        details_json='{"total": 1000, "videos": 900}'
    )
    log2 = JobLog(
        job_id=job_id,
        stage="METRICS",
        level="CALCULATION",
        message="Calculated Focus Ratio: 0.85 (850 focus videos / 1000 total)",
        details_json='{"focus_ratio": 0.85}'
    )
    db.add_all([log1, log2])
    db.commit()

    # Retrieve job and assert logs relationship
    retrieved_job = db.query(Job).filter(Job.id == job_id).first()
    assert retrieved_job is not None
    assert len(retrieved_job.logs) == 2
    assert retrieved_job.logs[0].stage == "INGESTION"
    assert retrieved_job.logs[1].level == "CALCULATION"
    assert "0.85" in retrieved_job.logs[1].message

def test_job_status_response_dto_includes_logs(setup_db):
    db = setup_db
    job_id = TEST_JOB_ID
    job = db.query(Job).filter(Job.id == job_id).first()

    # Convert to DTO
    log_dtos = [JobLogDTO.model_validate(log) for log in job.logs]
    dto = JobStatusResponseDTO(
        job_id=job.id,
        status=job.status,
        progress_pct=50.0,
        total_records=1000,
        video_records=900,
        community_post_records=50,
        ad_records=30,
        non_viewing_records=20,
        logs=log_dtos
    )

    assert len(dto.logs) == 2
    assert dto.logs[0].stage == "INGESTION"
    assert dto.logs[1].message.startswith("Calculated Focus Ratio")

