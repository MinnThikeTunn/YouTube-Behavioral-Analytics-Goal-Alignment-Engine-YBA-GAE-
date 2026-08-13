from typing import List, Dict, Any
from app.schemas.opportunity import VideoOpportunityDTO, ContentGapMatrixResponseDTO

class OpportunityEngine:
    def calculate_vos(self, demand_index: float, competitor_density: float) -> float:
        return demand_index / (competitor_density + 0.1)

    def determine_tier(self, vos_score: float) -> str:
        if vos_score >= 5.0:
            return "HIGH_OPPORTUNITY"
        elif vos_score >= 2.0:
            return "MODERATE"
        else:
            return "SATURATED"

    def analyze_opportunities(self, data: List[Dict[str, Any]]) -> ContentGapMatrixResponseDTO:
        opportunities = []
        total_vos = 0.0

        for item in data:
            demand = item.get("demand_index", 0.0)
            density = item.get("competitor_density", 0.0)
            topic = item.get("topic", "Unknown")
            titles = item.get("recommended_titles", [])

            vos = self.calculate_vos(demand, density)
            tier = self.determine_tier(vos)

            opp = VideoOpportunityDTO(
                topic=topic,
                demand_index=demand,
                competitor_density=density,
                vos_score=vos,
                opportunity_tier=tier,
                recommended_titles=titles
            )
            opportunities.append(opp)
            total_vos += vos

        avg_vos = total_vos / len(opportunities) if opportunities else 0.0
        return ContentGapMatrixResponseDTO(opportunities=opportunities, avg_vos_score=avg_vos)
