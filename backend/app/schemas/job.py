from datetime import datetime
from typing import Optional, List
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

class JobLogDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    stage: str
    level: str
    message: str
    details_json: Optional[str] = None

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
    logs: List[JobLogDTO] = []

