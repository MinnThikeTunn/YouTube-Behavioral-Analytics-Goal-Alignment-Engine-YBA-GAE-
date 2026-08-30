import math
from datetime import timedelta
from typing import List
from sqlalchemy.orm import Session
from app.db.models import RawRecord, RecordType
from app.schemas.velocity import SessionVelocityDTO, FatigueWindowDTO, VelocityAnalyticsResponseDTO

class VelocityEngine:
    @staticmethod
    def calculate_velocity(db: Session, job_id: str) -> VelocityAnalyticsResponseDTO:
        records = db.query(RawRecord).filter(
            RawRecord.job_id == job_id,
            RawRecord.record_type == RecordType.VIDEO
        ).order_by(RawRecord.timestamp.asc()).all()

        if not records:
            return VelocityAnalyticsResponseDTO(
                job_id=job_id,
                sessions=[],
                fatigue_windows=[],
                overall_v_cog=0.0
            )

        sessions: List[SessionVelocityDTO] = []
        current_session = []
        
        for rec in records:
            if not current_session:
                current_session.append(rec)
            else:
                last_rec = current_session[-1]
                if (rec.timestamp - last_rec.timestamp) > timedelta(minutes=30):
                    sessions.append(VelocityEngine._process_session(current_session))
                    current_session = [rec]
                else:
                    current_session.append(rec)
        
        if current_session:
            sessions.append(VelocityEngine._process_session(current_session))

        fatigue_windows: List[FatigueWindowDTO] = []
        for s in sessions:
            if s.fatigue_state == "FATIGUED":
                fatigue_windows.append(FatigueWindowDTO(
                    start_time=s.start_time,
                    end_time=s.end_time,
                    trigger_reason=f"High cognitive decay velocity (V_cog = {s.v_cog:.2f})",
                    recommended_action="Take a break or switch to a different task."
                ))

        overall_v_cog = sum(s.v_cog for s in sessions) / len(sessions) if sessions else 0.0

        return VelocityAnalyticsResponseDTO(
            job_id=job_id,
            sessions=sessions,
            fatigue_windows=fatigue_windows,
            overall_v_cog=overall_v_cog
        )

    @staticmethod
    def _process_session(records: List[RawRecord]) -> SessionVelocityDTO:
        start_time = records[0].timestamp
        end_time = records[-1].timestamp
        duration_hrs = (end_time - start_time).total_seconds() / 3600.0
        
        video_count = len(records)
        effective_hrs = max(duration_hrs, 0.25)
        raw_v_cog = video_count / effective_hrs
        v_cog = min(120.0, raw_v_cog)

        fatigue_state = "STABLE"
        if v_cog > 15:
            fatigue_state = "FATIGUED"
        elif v_cog > 5:
            fatigue_state = "DECAYING"

        return SessionVelocityDTO(
            session_id=f"sess_{start_time.strftime('%Y%m%d%H%M%S')}",
            start_time=start_time,
            end_time=end_time,
            video_count=video_count,
            v_cog=round(v_cog, 2),
            fatigue_state=fatigue_state
        )
