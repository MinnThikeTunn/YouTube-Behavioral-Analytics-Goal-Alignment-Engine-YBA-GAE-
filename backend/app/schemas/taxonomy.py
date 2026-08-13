from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class DAGNodeDTO(BaseModel):
    id: int
    job_id: str
    parent_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    is_completed: int = 0
    progress_pct: float = 0.0
    created_at: datetime
    children: List['DAGNodeDTO'] = []

    model_config = ConfigDict(from_attributes=True)

class DAGBuildRequestDTO(BaseModel):
    job_id: str

class DAGTreeResponseDTO(BaseModel):
    job_id: str
    nodes: List[DAGNodeDTO] = []
