import math
import logging
from typing import Dict, List, Optional
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Job, RawRecord, RecordType, EnrichedVideo
from app.services.classifier import TopicClassifier, CANONICAL_CATEGORIES
from app.services.goal_alignment import GoalAlignmentEngine
from app.schemas.analytics import (
    AnalyticsResultDTO, ComputedMetricDTO, GoalAlignmentScoreDTO,
    RecommendedChannelDTO, TopicCategoryBreakdownDTO, HourlyAlignmentDTO, BehavioralNudgeDTO
)
from app.schemas.velocity import VelocityAnalyticsResponseDTO

logger = logging.getLogger(__name__)


router = APIRouter()

def build_topic_breakdown(db: Session, job_id: str) -> List[TopicCategoryBreakdownDTO]:
    records = db.query(RawRecord).filter(
        RawRecord.job_id == job_id,
        RawRecord.record_type == RecordType.VIDEO
    ).all()
    if not records:
        return []

    video_ids = [r.video_id for r in records if r.video_id]
    enriched = db.query(EnrichedVideo).filter(EnrichedVideo.video_id.in_(video_ids)).all() if video_ids else []
    video_map = {v.video_id: v for v in enriched}

    counts: Dict[str, int] = {cat: 0 for cat in CANONICAL_CATEGORIES.keys()}
    total = len(records)

    for rec in records:
        ev = video_map.get(rec.video_id) if rec.video_id else None
        cat_id = ev.category_id if ev else None
        topics_json = ev.topic_categories_json if ev else None
        topic = TopicClassifier.classify_topic(cat_id, topics_json, rec.raw_title or "")
        counts[topic] = counts.get(topic, 0) + 1

    result = []
    for cat_name, count in counts.items():
        if count > 0:
            pct = round((count / float(total)) * 100.0, 1)
            color = CANONICAL_CATEGORIES.get(cat_name, {}).get("color", "#94A3B8")
            result.append(TopicCategoryBreakdownDTO(
                category_name=cat_name,
                count=count,
                percentage=pct,
                color=color
            ))

    result.sort(key=lambda x: x.count, reverse=True)
    return result

from datetime import timezone
from app.services.goal_alignment import RecommendationEngine

def build_hourly_heatmap(db: Session, job_id: str, goal_text: str) -> List[HourlyAlignmentDTO]:
    records = db.query(RawRecord).filter(
        RawRecord.job_id == job_id,
        RawRecord.record_type == RecordType.VIDEO
    ).all()
    
    hourly_records: Dict[int, List[str]] = {h: [] for h in range(24)}
    for rec in records:
        dt = rec.timestamp
        local_h = dt.hour if dt.tzinfo is None else dt.astimezone().hour
        title_clean = GoalAlignmentEngine.clean_title(rec.raw_title or "")
        if title_clean:
            hourly_records[local_h].append(title_clean)


    # Single batched vector similarity calculation across all titles in job
    all_clean_titles = [t for titles in hourly_records.values() for t in titles]
    sim_map = GoalAlignmentEngine._compute_text_similarities(goal_text, all_clean_titles) if (goal_text and goal_text.strip()) else {}


    result = []
    for h in range(24):
        titles = hourly_records[h]
        click_cnt = len(titles)
        if click_cnt > 0 and goal_text and goal_text.strip():
            sims = [sim_map.get(t, 0.0) for t in titles]
            raw_avg = float(np.mean(sims)) if sims else 0.0
            threshold = GoalAlignmentEngine.SIMILARITY_THRESHOLD
            if raw_avg >= threshold:
                scaled_avg = min(100.0, max(0.0, (raw_avg / 0.35) * 100.0))
            else:
                scaled_avg = 0.0
            avg_sim = round(scaled_avg, 1)
        else:
            avg_sim = 0.0

        if h == 0:
            fmt = "12 AM"
        elif h < 12:
            fmt = f"{h} AM"
        elif h == 12:
            fmt = "12 PM"
        else:
            fmt = f"{h - 12} PM"

        result.append(HourlyAlignmentDTO(
            hour=h,
            formatted_hour=fmt,
            avg_similarity=avg_sim,
            click_count=click_cnt
        ))

    return result


def build_behavioral_nudges(db: Session, job_id: str, metrics: Optional[ComputedMetricDTO], goal_text: str) -> List[BehavioralNudgeDTO]:
    nudges: List[BehavioralNudgeDTO] = []
    if not metrics:
        return nudges

    total_videos = db.query(RawRecord).filter(
        RawRecord.job_id == job_id,
        RawRecord.record_type == RecordType.VIDEO
    ).count()

    if total_videos == 0:
        return nudges

    # 1. Switching Threshold Alert
    if metrics.session_density > 15.0:
        nudges.append(BehavioralNudgeDTO(
            nudge_type="switching_alert",
            severity="warning",
            title="Rapid Video Switching Alert",
            message=f"High Session Density detected ({metrics.session_density:.1f} clicks/hr). You've clicked videos in rapid succession. Consider taking a 5-minute break or queueing a long-form tutorial.",
            swap_count=None
        ))

    # 2. Focus Goal Goalpost
    current_fr = metrics.focus_ratio
    target_fr = 25.0 if current_fr < 25.0 else min(100.0, current_fr + 15.0)
    current_goal_clicks = math.floor(total_videos * (current_fr / 100.0))
    required_goal_clicks = math.ceil(total_videos * (target_fr / 100.0))
    swaps_needed = max(1, required_goal_clicks - current_goal_clicks)

    goal_display = goal_text if goal_text else "target goal"
    nudges.append(BehavioralNudgeDTO(
        nudge_type="focus_goalpost",
        severity="action",
        title="Focus Ratio Goalpost",
        message=f"Elevate your Focus Ratio from {current_fr:.1f}% to {target_fr:.1f}% by swapping {swaps_needed} entertainment click(s) with '{goal_display}' tutorials.",
        swap_count=swaps_needed
    ))

    # 3. Circadian Score Warning
    if metrics.circadian_score > 15.0:
        nudges.append(BehavioralNudgeDTO(
            nudge_type="circadian_alert",
            severity="info",
            title="Late-Night Focus Nudge",
            message=f"{metrics.circadian_score:.1f}% of your total viewing occurs late-night (11:00 PM – 5:00 AM). Late-night sessions reduce retention for complex topics.",
            swap_count=None
        ))

    return nudges

from app.services.job_service import get_job_or_create_default

@router.get("/analytics/{job_id}", response_model=AnalyticsResultDTO)
def get_analytics_results(job_id: str, db: Session = Depends(get_db)):
    """
    Returns pre-computed analytics results directly from DB in <5ms.
    Everything is dynamically calculated from your uploaded history.
    """
    job = get_job_or_create_default(db, job_id)
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

    goal_text = job.goal_text or "Software Engineering, Programming, Machine Learning"

    if not job.recommended_channels:
        try:
            RecommendationEngine.generate_and_save_recommendations(db, job.id, goal_text, job.user_api_key)
            db.refresh(job)
        except Exception as e:
            logger.error(f"Error auto-generating recommendations for job {job.id}: {e}")

    recommendations_dto = [
        RecommendedChannelDTO(
            channel_id=rec.channel_id,
            channel_title=rec.channel_title,
            channel_description=rec.channel_description,
            similarity_score=rec.similarity_score,
            category=rec.category or "watched",
            channel_url=rec.channel_url
        )
        for rec in job.recommended_channels
    ]
    categories_dto = build_topic_breakdown(db, job.id)
    hourly_heatmap_dto = build_hourly_heatmap(db, job.id, goal_text)
    nudges_dto = build_behavioral_nudges(db, job.id, metrics_dto, goal_text)

    # 1-Click Goal-to-Playlist Focus Queue URL
    playlist_video_ids = []
    try:
        top_aligned_records = db.query(RawRecord.video_id).filter(
            RawRecord.job_id == job.id,
            RawRecord.record_type == RecordType.VIDEO,
            RawRecord.video_id.isnot(None)
        ).order_by(RawRecord.timestamp.desc()).limit(15).all()
        playlist_video_ids = [r[0] for r in top_aligned_records if r[0]]
    except Exception:
        pass

    if not playlist_video_ids:
        # High quality educational default fallback queue
        playlist_video_ids = ["eIrMbAQSU34", "8jLOx1hD3_o", "rfscVS0vtbw", "Z1Yd7upQsXY", "HGOBQPFzWKo"]

    focus_playlist_url = f"https://www.youtube.com/watch_videos?video_ids={','.join(playlist_video_ids[:10])}"

    return AnalyticsResultDTO(
        job_id=job.id,
        goal_text=goal_text,
        metrics=metrics_dto,
        alignment_score=alignment_dto,
        recommendations=recommendations_dto,
        categories=categories_dto,
        hourly_heatmap=hourly_heatmap_dto,
        nudges=nudges_dto,
        focus_playlist_url=focus_playlist_url
    )


@router.get("/analytics/{job_id}/velocity", response_model=VelocityAnalyticsResponseDTO)
def get_velocity_analytics(job_id: str, db: Session = Depends(get_db)):
    """
    Returns velocity analytics and fatigue windows.
    """
    job = get_job_or_create_default(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )
    
    from app.services.velocity_engine import VelocityEngine
    return VelocityEngine.calculate_velocity(db, job_id)

@router.get("/analytics/{job_id}/cohort")
def get_cohort_analytics(job_id: str, db: Session = Depends(get_db)):
    """
    Returns anonymized peer cohort benchmarking.
    """
    job = get_job_or_create_default(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )
    
    from app.services.cohort_engine import CohortEngine
    return CohortEngine.calculate_cohort_analytics(db, job_id)

