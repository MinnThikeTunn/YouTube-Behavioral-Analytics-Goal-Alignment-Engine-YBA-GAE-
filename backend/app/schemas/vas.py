from pydantic import BaseModel
from typing import List, Optional, Dict


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
    goal_alignment_score: Optional[float] = None


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


# ── Phase 4 Ticket 03: Closed-Loop Performance Tracking DTO ───


class ClosedLoopResponseDTO(BaseModel):
    total_evaluations: int
    tuned_weights: dict
    accuracy_pct: float
    mean_absolute_error: float
    recommendations: List[str] = []
    status: str = "OPTIMAL"


# ── Creator Intelligence New DTOs ────


class ThumbnailVisionResultDTO(BaseModel):
    brightness: float          # Normalized 0.0 - 1.0 (mean luminance)
    contrast: float            # Normalized 0.0 - 1.0 (RMS contrast / std dev)
    color_saturation: float    # Normalized 0.0 - 1.0 (mean S channel in HSV)
    sharpness: float           # Normalized 0.0 - 1.0 (Laplacian variance)
    color_balance: float       # Balance score relative to 0.6 optimal midpoint
    visual_impact_score: float # 0 - 100 overall visual score
    legibility_score: float    # 0 - 100 text contrast legibility
    readability_grade: str     # EXCELLENT | GOOD | FAIR | POOR
    dominant_colors: List[str] # Top 3 hex colors (e.g., ["#FF5733", "#1A1A1A", "#FFFFFF"])


class FactorScoreDTO(BaseModel):
    factor_key: str
    factor_name: str
    score: float           # 0.0 - 100.0
    weight: float
    description: str


class Composite8FactorScoreDTO(BaseModel):
    composite_overall_score: float
    factors: List[FactorScoreDTO]


class ClosedLoopSyncRequestDTO(BaseModel):
    evaluation_id: Optional[int] = None
    actual_ctr: float             # Percentage, e.g. 7.8
    actual_retention_30s: float   # Percentage, e.g. 68.5
    actual_views: int             # Total view count


class ClosedLoopTelemetryResultDTO(BaseModel):
    status: str                   # OPTIMAL | TUNING_ACTIVE
    total_evaluations: int
    tuned_weights: Dict[str, float]
    accuracy_pct: float
    mean_absolute_error: float
    weight_delta_w1: float
    weight_delta_w2: float
    weight_delta_w3: float
    message: str


