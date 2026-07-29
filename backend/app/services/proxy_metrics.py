import numpy as np
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import RawRecord, RecordType, EnrichedVideo, ComputedMetric

logger = logging.getLogger(__name__)

class ProxyMetricsEngine:
    SESSION_BOUNDARY_SECONDS: float = 1800.0  # 30 minutes
    HIGH_DENSITY_THRESHOLD: float = 15.0       # 15 clicks/hour

    @classmethod
    def calculate_completion_probabilities(
        cls,
        records: List[RawRecord],
        video_duration_map: Dict[str, int]
    ) -> List[float]:
        """
        Computes Completion Probability (Pn) per video click:
        Pn = min(1.0, (t_{n+1} - t_n) / D_n)
        Applies 30-minute session boundary cutoff rule.
        """
        if not records:
            return []

        completion_probs: List[float] = []

        for i in range(len(records)):
            rec = records[i]
            duration = video_duration_map.get(rec.video_id, 0) if rec.video_id else 0

            # If duration is missing or zero, default to 0.5 (unknown estimation)
            if duration <= 0:
                continue

            if i < len(records) - 1:
                next_rec = records[i + 1]
                gap_seconds = (next_rec.timestamp - rec.timestamp).total_seconds()

                if gap_seconds > cls.SESSION_BOUNDARY_SECONDS:
                    # End of session: evaluate against full duration ceiling
                    prob = 1.0
                elif gap_seconds < 0:
                    prob = 0.0
                else:
                    prob = min(1.0, gap_seconds / float(duration))
            else:
                # Final video in dataset
                prob = 1.0

            completion_probs.append(prob)

        return completion_probs

    @classmethod
    def calculate_session_density(cls, records: List[RawRecord]) -> float:
        """
        Groups video clicks into active sessions separated by >30 minute gaps.
        Calculates average Session Density = Total Clicks in Session / Session Duration (Hours).
        """
        if not records:
            return 0.0

        sessions: List[List[RawRecord]] = []
        current_session: List[RawRecord] = [records[0]]

        for i in range(1, len(records)):
            prev = records[i - 1]
            curr = records[i]
            gap = (curr.timestamp - prev.timestamp).total_seconds()

            if gap > cls.SESSION_BOUNDARY_SECONDS:
                sessions.append(current_session)
                current_session = [curr]
            else:
                current_session.append(curr)

        if current_session:
            sessions.append(current_session)

        session_densities: List[float] = []
        for session in sessions:
            click_count = len(session)
            if click_count <= 1:
                # 1-click session density default
                session_densities.append(1.0)
                continue

            start_time = session[0].timestamp
            end_time = session[-1].timestamp
            duration_hours = max((end_time - start_time).total_seconds() / 3600.0, 1.0 / 60.0) # minimum 1 minute
            density = click_count / duration_hours
            session_densities.append(density)

        return float(np.mean(session_densities)) if session_densities else 0.0

    @classmethod
    def calculate_circadian_score(cls, records: List[RawRecord]) -> float:
        """
        Calculates Circadian Score = (Clicks between 23:00 and 05:00 local time / Total Clicks) * 100.
        """
        if not records:
            return 0.0

        late_night_clicks = 0
        for rec in records:
            hour = rec.timestamp.hour
            if hour >= 23 or hour < 5:
                late_night_clicks += 1

        return (late_night_clicks / float(len(records))) * 100.0

    @classmethod
    def compute_job_metrics(cls, db: Session, job_id: str) -> ComputedMetric:
        """
        Fetches filtered video events and enriched video metadata for job_id,
        computes all mathematical proxy metrics, and saves to SQLite ComputedMetric table.
        """
        video_records = db.query(RawRecord).filter(
            RawRecord.job_id == job_id,
            RawRecord.record_type == RecordType.VIDEO
        ).order_by(RawRecord.timestamp.asc()).all()

        if not video_records:
            metric = ComputedMetric(
                job_id=job_id,
                focus_ratio=0.0,
                median_completion_prob=0.0,
                session_density=0.0,
                circadian_score=0.0,
                window_period="all_time"
            )
            db.merge(metric)
            db.commit()
            return metric

        # Query video durations
        video_ids = [r.video_id for r in video_records if r.video_id]
        enriched_videos = db.query(EnrichedVideo.video_id, EnrichedVideo.duration_seconds).filter(
            EnrichedVideo.video_id.in_(video_ids)
        ).all()

        video_duration_map = {v[0]: (v[1] or 0) for v in enriched_videos}

        # 1. Completion Probability
        completion_probs = cls.calculate_completion_probabilities(video_records, video_duration_map)
        median_completion = float(np.median(completion_probs)) if completion_probs else 0.5

        # 2. Session Density
        session_density = cls.calculate_session_density(video_records)

        # 3. Circadian Score
        circadian_score = cls.calculate_circadian_score(video_records)

        # Baseline Focus Ratio (updated in Ticket 05 by GoalAlignmentEngine)
        focus_ratio = 50.0

        metric = db.query(ComputedMetric).filter(ComputedMetric.job_id == job_id).first()
        if not metric:
            metric = ComputedMetric(job_id=job_id)

        metric.focus_ratio = focus_ratio
        metric.median_completion_prob = median_completion
        metric.session_density = session_density
        metric.circadian_score = circadian_score
        metric.window_period = "all_time"

        db.merge(metric)
        db.commit()
        logger.info(
            f"Job {job_id} Computed Metrics: Completion={median_completion:.2f}, "
            f"Density={session_density:.1f} clicks/hr, Circadian={circadian_score:.1f}%"
        )
        return metric
