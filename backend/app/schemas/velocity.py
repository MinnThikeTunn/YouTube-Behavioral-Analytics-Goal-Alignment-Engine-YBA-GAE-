from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SessionVelocityDTO(BaseModel):
    session_id: str
    start_time: datetime
    end_time: datetime
    video_count: int
    v_cog: float
    fatigue_state: str

class FatigueWindowDTO(BaseModel):
    start_time: datetime
    end_time: datetime
    trigger_reason: str
    recommended_action: str

class VelocityAnalyticsResponseDTO(BaseModel):
    job_id: str
    sessions: List[SessionVelocityDTO]
    fatigue_windows: List[FatigueWindowDTO]
    overall_v_cog: float
