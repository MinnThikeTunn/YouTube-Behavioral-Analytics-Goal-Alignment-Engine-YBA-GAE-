from pydantic import BaseModel
from typing import List, Optional

class NicheTrendDTO(BaseModel):
    niche_name: str
    trend_velocity: float
    trajectory: str
    keyword_clusters: List[str]
    delta_views: float
    delta_uploads: float
    sentiment_ratio: float

class NicheTrendRadarResponseDTO(BaseModel):
    trends: List[NicheTrendDTO]
    overall_market_sentiment: float
    aligned_goal: Optional[str] = None

