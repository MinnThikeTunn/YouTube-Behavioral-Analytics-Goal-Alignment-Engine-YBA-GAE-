from pydantic import BaseModel
from typing import List

class CohortBenchmarkDTO(BaseModel):
    percentile_rank: float
    cohort_tier: str
    focus_streak_comparison: float
    cohort_size: int
    cohort_name: str

class CohortAnalyticsResponseDTO(BaseModel):
    job_id: str
    benchmark: CohortBenchmarkDTO
    insights: List[str]
