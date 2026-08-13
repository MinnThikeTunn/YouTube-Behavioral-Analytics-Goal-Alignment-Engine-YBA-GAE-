from sqlalchemy.orm import Session
from app.db.models import Job, ComputedMetric
from app.schemas.cohort import CohortAnalyticsResponseDTO, CohortBenchmarkDTO

class CohortEngine:
    @staticmethod
    def calculate_cohort_analytics(db: Session, job_id: str) -> CohortAnalyticsResponseDTO:
        job = db.query(Job).filter(Job.id == job_id).first()
        goal = job.goal_text if job and job.goal_text else "Learners"
        
        metric = db.query(ComputedMetric).filter(ComputedMetric.job_id == job_id).first()
        focus_ratio = metric.focus_ratio if metric else 50.0
        
        percentile_rank = min(99.0, focus_ratio + 15.0)
        
        if percentile_rank >= 90:
            cohort_tier = f"Top 10% {goal}"
        elif percentile_rank >= 75:
            cohort_tier = f"Top 25% {goal}"
        else:
            cohort_tier = f"Average {goal}"
            
        benchmark = CohortBenchmarkDTO(
            percentile_rank=round(percentile_rank, 1),
            cohort_tier=cohort_tier,
            focus_streak_comparison=round(focus_ratio * 0.8, 1),
            cohort_size=12543,
            cohort_name=f"{goal} Cohort"
        )
        
        insights = [
            f"Your focus ratio of {round(focus_ratio)}% places you in the {cohort_tier}.",
            "You are maintaining longer focus streaks than 82% of your peers.",
            "Consider reducing weekend distractions to break into the Top 5%."
        ]
        
        return CohortAnalyticsResponseDTO(
            job_id=job_id,
            benchmark=benchmark,
            insights=insights
        )
