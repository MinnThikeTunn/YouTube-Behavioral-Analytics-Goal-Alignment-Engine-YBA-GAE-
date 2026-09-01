from typing import List, Dict, Any, Optional

from app.schemas.trend import NicheTrendDTO, NicheTrendRadarResponseDTO

class TrendRadarEngine:
    def __init__(self, w1: float = 0.5, w2: float = 0.3, w3: float = 0.2):
        self.w1 = w1
        self.w2 = w2
        self.w3 = w3
        
    def calculate_velocity(self, delta_views: float, delta_uploads: float, sentiment_ratio: float) -> float:
        raw_val = self.w1 * delta_views + self.w2 * delta_uploads + self.w3 * sentiment_ratio
        # Scale to realistic velocity percentage if raw_val is normalized (e.g. 0.5-1.8 -> 50%-180%)
        if raw_val <= 3.0:
            return round(raw_val * 100.0, 1)
        return round(raw_val, 1)
        
    def determine_trajectory(self, velocity: float) -> str:
        thresh_exploding = 80.0 if velocity > 3.0 else 0.8
        thresh_rising = 40.0 if velocity > 3.0 else 0.4
        thresh_stable = 0.0 if velocity > 3.0 else -0.2

        if velocity >= thresh_exploding:
            return "EXPLODING"
        elif velocity >= thresh_rising:
            return "RISING"
        elif velocity >= thresh_stable:
            return "STABLE"
        else:
            return "DECLINING"
            
    def analyze_trends(self, data: List[Dict[str, Any]]) -> NicheTrendRadarResponseDTO:
        trends = []
        total_sentiment = 0.0
        for item in data:
            vel = self.calculate_velocity(item['delta_views'], item['delta_uploads'], item['sentiment_ratio'])
            traj = self.determine_trajectory(vel)
            
            total_sentiment += item['sentiment_ratio']
            
            trends.append(NicheTrendDTO(
                niche_name=item['niche_name'],
                trend_velocity=vel,
                trajectory=traj,
                keyword_clusters=item.get('keyword_clusters', []),
                delta_views=item['delta_views'],
                delta_uploads=item['delta_uploads'],
                sentiment_ratio=item['sentiment_ratio']
            ))
            
        overall_sentiment = total_sentiment / len(data) if data else 0.0
        
        return NicheTrendRadarResponseDTO(
            trends=trends,
            overall_market_sentiment=overall_sentiment
        )

    def fetch_dynamic_niche_trends(self, query: Optional[str] = None, goal: Optional[str] = None) -> NicheTrendRadarResponseDTO:
        """Dynamically fetch niche trends aligned with user goal using Tavily / Gemini / heuristics."""
        from app.services.tavily_search import TavilySearchService
        tavily = TavilySearchService()
        dynamic_data = tavily.search_niche_trends(query=query, goal=goal)
        radar_result = self.analyze_trends(dynamic_data)
        radar_result.aligned_goal = goal
        return radar_result


