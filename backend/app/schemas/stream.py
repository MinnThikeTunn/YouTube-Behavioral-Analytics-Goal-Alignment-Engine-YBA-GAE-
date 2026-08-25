from pydantic import BaseModel
from typing import Optional

class StreamTelemetrySchema(BaseModel):
    job_id: Optional[str] = None
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

class BatchStreamTelemetrySchema(BaseModel):
    items: list[StreamTelemetrySchema]
    goal_text: Optional[str] = "Software Engineering, Programming, Machine Learning"
    job_id: Optional[str] = "stream_job_default"

class BatchStreamResponseDTO(BaseModel):
    status: str
    ingested_count: int
    job_id: str
    message: str

