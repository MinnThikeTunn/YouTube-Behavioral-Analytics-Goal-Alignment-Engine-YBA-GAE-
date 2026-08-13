from pydantic import BaseModel
from typing import Optional

class StreamTelemetrySchema(BaseModel):
    video_id: str
    title: Optional[str] = None
    channel_name: Optional[str] = None
    watch_seconds: int = 0
    duration_seconds: int = 0
    is_active_tab: bool = True
    timestamp: str
    goal_text: str

class StreamScoreResponseDTO(BaseModel):
    video_id: str
    alignment_score: float
    classification: str
    status: str
