from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from enum import Enum

class CommentIntentEnum(str, Enum):
    REQUEST = "REQUEST"
    CONFUSION = "CONFUSION"
    PRAISE = "PRAISE"
    DEBATE = "DEBATE"

class CommentMiningRequestDTO(BaseModel):
    video_id: str
    max_results: int = 100

class MinedCommentDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    comment_id: str
    author_name: Optional[str] = None
    text_display: str
    like_count: int = 0
    published_at: Optional[datetime] = None
    intent_label: Optional[CommentIntentEnum] = None
    sentiment_score: Optional[float] = None


class CommentMiningResponseDTO(BaseModel):
    video_id: str
    total_mined: int
    comments: List[MinedCommentDTO]


class IntentDistributionBreakdownDTO(BaseModel):
    intent_label: str       # REQUEST | CONFUSION | PRAISE | DEBATE
    count: int
    percentage: float


class TopicIntentHeatmapCellDTO(BaseModel):
    topic: str
    intent_label: str
    comment_count: int
    heat_score: float       # Normalized intensity 0.0 - 100.0


class ChannelIntentDistributionDTO(BaseModel):
    total_comments_analyzed: int
    total_videos_analyzed: int
    distribution: List[IntentDistributionBreakdownDTO]
    heatmap: List[TopicIntentHeatmapCellDTO]
    top_feature_requests: List[str]
    top_confusion_points: List[str]
    channel_sentiment_index: float
    mined_comments: Optional[List[MinedCommentDTO]] = []


