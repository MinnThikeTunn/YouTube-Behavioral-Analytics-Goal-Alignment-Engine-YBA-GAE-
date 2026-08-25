import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ab_packaging_matrix_evaluation():
    payload = {
        "variants": [
            {
                "variant_id": "var_a",
                "variant_label": "Variant A (How-To Tutorial)",
                "title": "How To Build Full-Stack AI Apps in 2026: Fast Tutorial",
                "hook_script": "Most developers struggle with full stack AI, but here is the exact 10 minute roadmap.",
                "thumbnail_brightness": 0.65,
                "thumbnail_contrast": 0.75
            },
            {
                "variant_id": "var_b",
                "variant_label": "Variant B (Mistake Focus)",
                "title": "Why 99% Of Junior Developers Fail Coding Interviews",
                "hook_script": "Stop preparing for interviews the old way. Here is the single mistake costing you offers.",
                "thumbnail_brightness": 0.55,
                "thumbnail_contrast": 0.60
            }
        ]
    }

    response = client.post("/api/v1/creator/packaging/ab-matrix", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "winning_variant_id" in data
    assert data["best_overall_vas"] > 0
    assert len(data["variants"]) == 2
    assert any(v["is_winner"] for v in data["variants"])
    assert "comparison_summary" in data


def test_ai_hook_script_generation():
    payload = {
        "title": "Mastering Distributed Systems in Python",
        "topic": "Python Distributed Systems",
        "target_audience": "Senior Software Engineers"
    }

    response = client.post("/api/v1/creator/packaging/generate-hooks", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["title"] == payload["title"]
    assert len(data["hooks"]) == 3
    for hook in data["hooks"]:
        assert hook["hook_style"] in ["Curiosity Gap", "Pain Point / Mistake", "Story & Challenge Hook"]
        assert len(hook["script_text"]) > 20
        assert hook["estimated_retention_pct"] > 50.0
