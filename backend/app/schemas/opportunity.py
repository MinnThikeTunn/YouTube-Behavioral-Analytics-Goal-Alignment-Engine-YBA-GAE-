from pydantic import BaseModel
from typing import List, Optional
from app.schemas.vas import FactorScoreDTO

class VideoOpportunityDTO(BaseModel):
    topic: str
    demand_index: float
    competitor_density: float
    vos_score: float
    opportunity_tier: str
    recommended_titles: List[str]
    goal_alignment_score: float = 85.0
    title_match_scores: Optional[List[float]] = None
    factor_scores: Optional[List[FactorScoreDTO]] = None

class ContentGapMatrixResponseDTO(BaseModel):
    opportunities: List[VideoOpportunityDTO]
    avg_vos_score: float
    aligned_goal: Optional[str] = None

