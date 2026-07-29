import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Job, ComputedMetric, GoalAlignmentScore, EnrichedChannel
from app.schemas.analytics import AnalyticsResultDTO, ComputedMetricDTO, GoalAlignmentScoreDTO, RecommendedChannelDTO
from app.services.goal_alignment import RecommendationEngine

router = APIRouter()

@router.get("/analytics/{job_id}", response_model=AnalyticsResultDTO)
def get_analytics_results(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )

    metrics_dto = None
    if job.computed_metrics:
        metrics_dto = ComputedMetricDTO(
            focus_ratio=job.computed_metrics.focus_ratio,
            median_completion_prob=job.computed_metrics.median_completion_prob,
            session_density=job.computed_metrics.session_density,
            circadian_score=job.computed_metrics.circadian_score,
            window_period=job.computed_metrics.window_period
        )

    alignment_dto = None
    if job.alignment_score:
        alignment_dto = GoalAlignmentScoreDTO(
            alignment_probability_score=job.alignment_score.alignment_probability_score,
            focus_ratio_weight=job.alignment_score.focus_ratio_weight,
            completion_weight=job.alignment_score.completion_weight,
            session_density_penalty=job.alignment_score.session_density_penalty,
            circadian_penalty=job.alignment_score.circadian_penalty
        )

    # Fetch top channel recommendations
    rec_list = RecommendationEngine.generate_channel_recommendations(db, job_id, job.goal_text, top_k=5)
    recommendations_dto = [
        RecommendedChannelDTO(
            channel_id=rec["channel_id"],
            channel_title=rec["channel_title"],
            channel_description=rec["channel_description"],
            similarity_score=rec["similarity_score"]
        )
        for rec in rec_list
    ]

    return AnalyticsResultDTO(
        job_id=job.id,
        metrics=metrics_dto,
        alignment_score=alignment_dto,
        recommendations=recommendations_dto
    )
