from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.db.models import JobStatus

class JobCreateDTO(BaseModel):
    goal_text: str
    user_api_key: Optional[str] = None

class UploadResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: str
    status: JobStatus
    message: str
    created_at: datetime

class JobStatusResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: str
    status: JobStatus
    progress_pct: float
    total_records: int
    video_records: int
    community_post_records: int
    ad_records: int
    non_viewing_records: int
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None
