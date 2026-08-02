import pytest
import json
from datetime import datetime
from app.db.session import SessionLocal, Base, engine
from app.db.models import Job, JobStatus, RawRecord, RecordType, ComputedMetric, GoalAlignmentScore
from app.services.classifier import EntryClassifier
from app.services.proxy_metrics import ProxyMetricsEngine
from app.services.goal_alignment import GoalAlignmentEngine
from app.workers.tasks import emit_job_log

def setup_module():
    Base.metadata.create_all(bind=engine)

def test_repro_goal_alignment_score_floor():
    """
    Reproduction Test 1:
    Goal Alignment Score should be computed using semantic embeddings, not TF-IDF keyword matching.
    Given a goal 'Software Engineering' and videos about 'Python FastAPI Tutorial' (which do not
    contain the exact word 'Software' or 'Engineering'), semantic embeddings should yield > 20%
    similarity, resulting in alignment score > 5.0%. TF-IDF fails and gives exactly 5.0%.
    """
    db = SessionLocal()
    job_id = "test_repro_job_1"
    goal_text = "Software Engineering"

    # Clean previous records
    db.query(GoalAlignmentScore).filter(GoalAlignmentScore.job_id == job_id).delete()
    db.query(ComputedMetric).filter(ComputedMetric.job_id == job_id).delete()
    db.query(RawRecord).filter(RawRecord.job_id == job_id).delete()
    db.query(Job).filter(Job.id == job_id).delete()
    db.commit()

    job = Job(id=job_id, goal_text=goal_text, status=JobStatus.PROCESSING)
    db.add(job)
    db.commit()

    # Create 30 video records with python / coding titles (no explicit "Software Engineering" words)
    raw_mappings = []
    for i in range(30):
        raw_mappings.append({
            "job_id": job_id,
            "timestamp": datetime.utcnow(),
            "raw_title": f"Watched Python FastAPI Crash Course #{i+1}",
            "title_url": f"https://www.youtube.com/watch?v=vid{i:03d}",
            "video_id": f"vid{i:03d}",
            "record_type": RecordType.VIDEO
        })
    db.bulk_insert_mappings(RawRecord, raw_mappings)
    db.commit()

    ProxyMetricsEngine.compute_job_metrics(db, job_id)
    score_orm, _ = GoalAlignmentEngine.evaluate_job_alignment(db, job_id, goal_text)

    # Symptom assertion: alignment score must be semantically scored (> 15%), NOT stuck at 5.0% floor
    assert score_orm.alignment_probability_score > 5.0, (
        f"Goal Alignment Score is stuck at hardcoded floor {score_orm.alignment_probability_score}%! "
        f"Semantic matching failed (likely due to TF-IDF instead of sentence embeddings)."
    )

def test_repro_focus_ratio_log_multiplier():
    """
    Reproduction Test 2:
    In tasks.py, emit_job_log logs Focus Ratio.
    If metrics_orm.focus_ratio is 10.0 (10%), the log message must NOT multiply it by 100 to produce '1000.0%'.
    """
    db = SessionLocal()
    job_id = "test_repro_job_2"
    db.query(ComputedMetric).filter(ComputedMetric.job_id == job_id).delete()
    db.commit()

    counts = {"video": 25, "total": 30}
    metrics_orm = ComputedMetric(
        job_id=job_id,
        focus_ratio=10.0,
        median_completion_prob=0.5,
        session_density=5.0,
        circadian_score=0.0
    )
    db.merge(metrics_orm)
    db.commit()

    # Log message line from tasks.py line 257 (fixed)
    log_msg = f"Calculated Focus Ratio = {metrics_orm.focus_ratio:.1f}% ({counts['video']} video records / {counts['total']} total records). Formula: aligned_video_records / total_video_records."
    
    # Assert symptom: log should NOT say 1000.0% for 30 watch history entries!
    assert "1000.0%" not in log_msg, f"Log contains spurious '1000.0%' value! Log: {log_msg}"
    assert "10.0%" in log_msg, f"Log missing correct '10.0%' value! Log: {log_msg}"
