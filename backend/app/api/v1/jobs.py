from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Job
from app.schemas.job import JobStatusResponseDTO, JobLogDTO, GoalUpdateDTO

from app.services.job_service import get_job_or_create_default

router = APIRouter()

@router.get("/jobs/{job_id}/status", response_model=JobStatusResponseDTO)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = get_job_or_create_default(db, job_id)
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

@router.patch("/jobs/{job_id}/goal")
async def update_job_goal(job_id: str, payload: GoalUpdateDTO, db: Session = Depends(get_db)):
    job = get_job_or_create_default(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )


    job.goal_text = payload.goal_text.strip()
    db.commit()

    # Clear existing recommendations & re-evaluate goal alignment & DAG taxonomy graph
    from app.db.models import RecommendedChannel
    from app.services.goal_alignment import GoalAlignmentEngine, RecommendationEngine
    from app.services.dag_engine import DAGEngine
    from app.services.broadcaster import broadcaster

    db.query(RecommendedChannel).filter(RecommendedChannel.job_id == job_id).delete()
    db.commit()

    score_orm = None
    try:
        RecommendationEngine.generate_and_save_recommendations(
            db=db,
            job_id=job_id,
            goal_text=job.goal_text,
            user_api_key=job.user_api_key
        )
        score_orm = job.alignment_score
    except Exception as e:
        score_orm, _ = GoalAlignmentEngine.evaluate_job_alignment(db, job_id, job.goal_text)

    try:
        DAGEngine.build_dag_for_job(db, job_id)
    except Exception as e:
        pass

    try:
        await broadcaster.broadcast_alignment_update(job.id, score_orm or job.alignment_score, job.computed_metrics)
    except Exception:
        pass

    return {
        "status": "success",
        "job_id": job.id,
        "goal_text": job.goal_text
    }

