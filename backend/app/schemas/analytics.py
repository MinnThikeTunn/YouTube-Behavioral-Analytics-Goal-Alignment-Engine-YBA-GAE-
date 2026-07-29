from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class ComputedMetricDTO(BaseModel):
    focus_ratio: float
    median_completion_prob: float
    session_density: float
    circadian_score: float
    window_period: str

class GoalAlignmentScoreDTO(BaseModel):
    alignment_probability_score: float
    focus_ratio_weight: float
    completion_weight: float
    session_density_penalty: float
    circadian_penalty: float

class RecommendedChannelDTO(BaseModel):
    channel_id: str
    channel_title: str
    channel_description: Optional[str] = None
    similarity_score: float

class AnalyticsResultDTO(BaseModel):
    job_id: str
    metrics: Optional[ComputedMetricDTO] = None
    alignment_score: Optional[GoalAlignmentScoreDTO] = None
    recommendations: List[RecommendedChannelDTO] = []
