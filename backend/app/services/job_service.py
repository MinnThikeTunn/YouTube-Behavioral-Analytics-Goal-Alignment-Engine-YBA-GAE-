from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import Job, JobStatus, ComputedMetric, GoalAlignmentScore

def get_job_or_create_default(db: Session, job_id: str) -> Optional[Job]:
    """
    Retrieves a Job by ID. If job_id is 'stream_job_default' and no Job exists yet,
    automatically initializes stream_job_default with default baseline metrics.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if job:
        return job

    if job_id == "stream_job_default":
        job = Job(
            id="stream_job_default",
            status=JobStatus.COMPLETED,
            goal_text="Software Engineering, Programming, Machine Learning",
            total_records=0,
            video_records=0
        )
        db.add(job)

        metrics = ComputedMetric(
            job_id="stream_job_default",
            focus_ratio=0.0,
            median_completion_prob=0.0,
            session_density=0.0,
            circadian_score=0.0
        )
        db.add(metrics)

        score = GoalAlignmentScore(
            job_id="stream_job_default",
            alignment_probability_score=0.0,
            focus_ratio_weight=0.40,
            completion_weight=0.60,
            session_density_penalty=0.0,
            circadian_penalty=0.0
        )
        db.add(score)

        db.commit()
        db.refresh(job)
        return job

    return None
