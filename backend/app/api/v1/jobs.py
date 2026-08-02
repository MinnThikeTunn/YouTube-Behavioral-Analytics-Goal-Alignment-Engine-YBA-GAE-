from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Job
from app.schemas.job import JobStatusResponseDTO, JobLogDTO

router = APIRouter()

@router.get("/jobs/{job_id}/status", response_model=JobStatusResponseDTO)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )

    return JobStatusResponseDTO(
        job_id=job.id,
        status=job.status,
        progress_pct=job.progress_pct,
        total_records=job.total_records,
        video_records=job.video_records,
        community_post_records=job.community_post_records,
        ad_records=job.ad_records,
        non_viewing_records=job.non_viewing_records,
        error_message=job.error_message,
        completed_at=job.completed_at,
        logs=[JobLogDTO.model_validate(log) for log in job.logs]
    )
