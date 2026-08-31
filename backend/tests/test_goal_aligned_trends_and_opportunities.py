import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_niche_trends_endpoint_aligns_with_specific_goal():
    """
    Seam 1: GET /api/v1/creator/trends?goal=...
    Verifies that when a specific goal is provided, the response reflects the goal
    and returns aligned_goal matching the query.
    """
    test_goal = "Fitness, Marathon Training & Endurance Nutrition"
    response = client.get("/api/v1/creator/trends", params={"goal": test_goal})
    assert response.status_code == 200
    data = response.json()
    assert "trends" in data
    assert len(data["trends"]) > 0
    assert data.get("aligned_goal") == test_goal
    # Trends or keywords should reflect the fitness context rather than generic software
    combined_content = " ".join(
        [t["niche_name"] + " " + " ".join(t.get("keyword_clusters", [])) for t in data["trends"]]
    ).lower()
    assert any(k in combined_content for k in ["fitness", "marathon", "endurance", "nutrition", "training", "running", "cardio", "health"])


def test_video_opportunities_endpoint_aligns_with_specific_goal():
    """
    Seam 1: GET /api/v1/creator/opportunity?goal=...
    Verifies that when a specific goal is provided, the opportunity matrix returns
    topics and recommended titles reflecting the goal, with aligned_goal matching the query.
    """
    test_goal = "Fullstack Flutter & Dart Mobile App Development"
    response = client.get("/api/v1/creator/opportunity", params={"goal": test_goal})
    assert response.status_code == 200
    data = response.json()
    assert "opportunities" in data
    assert len(data["opportunities"]) > 0
    assert data.get("aligned_goal") == test_goal

    
    first_opp = data["opportunities"][0]
    assert 0.0 <= first_opp["goal_alignment_score"] <= 100.0
    combined_text = (first_opp["topic"] + " " + " ".join(first_opp["recommended_titles"])).lower()
    assert any(k in combined_text for k in ["flutter", "dart", "mobile", "app", "widget", "cross-platform", "ui", "state"])


def test_default_endpoints_maintain_backward_compatibility():
    """
    Verifies that calling the endpoints without a goal parameter maintains
    full backward compatibility with existing tests and behavior.
    """
    resp_trends = client.get("/api/v1/creator/trends")
    assert resp_trends.status_code == 200
    assert len(resp_trends.json()["trends"]) > 0

    resp_opps = client.get("/api/v1/creator/opportunity")
    assert resp_opps.status_code == 200
    assert len(resp_opps.json()["opportunities"]) > 0
