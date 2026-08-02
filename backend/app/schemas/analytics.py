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
    channel_id: Optional[str] = None
    channel_title: str
    channel_description: Optional[str] = None
    similarity_score: float
    category: str = "watched"  # "watched" or "discovery"
    channel_url: Optional[str] = None

class TopicCategoryBreakdownDTO(BaseModel):
    category_name: str
    count: int
    percentage: float
    color: str

class HourlyAlignmentDTO(BaseModel):
    hour: int
    formatted_hour: str
    avg_similarity: float
    click_count: int

class BehavioralNudgeDTO(BaseModel):
    nudge_type: str  # "switching_alert" | "focus_goalpost" | "circadian_alert"
    severity: str    # "warning" | "info" | "action"
    title: str
    message: str
    swap_count: Optional[int] = None

class AnalyticsResultDTO(BaseModel):
    job_id: str
    goal_text: Optional[str] = None
    metrics: Optional[ComputedMetricDTO] = None
    alignment_score: Optional[GoalAlignmentScoreDTO] = None
    recommendations: List[RecommendedChannelDTO] = []
    categories: List[TopicCategoryBreakdownDTO] = []
    hourly_heatmap: List[HourlyAlignmentDTO] = []
    nudges: List[BehavioralNudgeDTO] = []

