from pydantic import BaseModel
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
    comment_id: str
    author_name: Optional[str] = None
    text_display: str
    like_count: int = 0
    published_at: Optional[datetime] = None
    intent_label: Optional[CommentIntentEnum] = None
    sentiment_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class CommentMiningResponseDTO(BaseModel):
    video_id: str
    total_mined: int
    comments: List[MinedCommentDTO]
