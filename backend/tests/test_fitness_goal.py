import pytest
from app.services.goal_alignment import RecommendationEngine, CURATED_DISCOVERY_MAP

def test_fitness_goal_discovery_fallback():
    # Test that fallback for "Fitness" returns fitness-related channels, not software engineering
    items = RecommendationEngine.fetch_gemini_discovery_channels("Fitness")
    assert len(items) > 0
    titles_desc = " ".join([i["channel_title"] + " " + i.get("channel_description", "") for i in items]).lower()
    
    # Must NOT contain software engineering default fallback terms like "freecodecamp" or "fireship"
    assert "freecodecamp" not in titles_desc
    assert "fireship" not in titles_desc
