from pydantic import BaseModel
from typing import List, Optional


class VASEvalRequestDTO(BaseModel):
    title: str
    hook_script: str
    thumbnail_brightness: Optional[float] = None
    thumbnail_contrast: Optional[float] = None


class VASEvalResponseDTO(BaseModel):
    overall_vas: float
    title_score: float
    thumbnail_score: float
    hook_score: float
    recommendations: List[str] = []
    improved_title_ideas: List[str] = []


# ── Phase 4 Ticket 02: Detailed Vision & Hook Analysis DTOs ────


class ThumbnailAnalysisDTO(BaseModel):
    brightness: Optional[float] = None
    contrast: Optional[float] = None
    color_balance: float = 0.0
    saturation_estimate: float = 0.0
    visual_impact_score: float = 0.0
    legibility_score: float = 0.0
    readability_grade: str = "FAIR"


class TitlePatternDTO(BaseModel):
    pattern_type: str
    suggested_title: str


class TitleAnalysisDTO(BaseModel):
    original_title: str
    char_count: int = 0
    curiosity_word_count: int = 0
    power_word_count: int = 0
    has_number: bool = False
    has_question: bool = False
    pattern_suggestions: List[TitlePatternDTO] = []


class HookAnalysisDTO(BaseModel):
    word_count: int = 0
    word_pacing_score: float = 0.0
    emotional_arc_score: float = 0.0
    call_to_action_presence: bool = False
    hook_phrase_count: int = 0
    estimated_retention_pct: float = 0.0


class DetailedVASAnalysisDTO(BaseModel):
    overall_vas: float
    title_score: float
    thumbnail_score: float
    hook_score: float
    thumbnail_analysis: ThumbnailAnalysisDTO
    title_analysis: TitleAnalysisDTO
    hook_analysis: HookAnalysisDTO
    recommendations: List[str] = []
    improved_title_ideas: List[TitlePatternDTO] = []
