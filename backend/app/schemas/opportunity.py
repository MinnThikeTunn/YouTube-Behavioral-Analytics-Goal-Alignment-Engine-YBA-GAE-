from pydantic import BaseModel
from typing import List

class VideoOpportunityDTO(BaseModel):
    topic: str
    demand_index: float
    competitor_density: float
    vos_score: float
    opportunity_tier: str
    recommended_titles: List[str]
    goal_alignment_score: float = 85.0

class ContentGapMatrixResponseDTO(BaseModel):
    opportunities: List[VideoOpportunityDTO]
    avg_vos_score: float
