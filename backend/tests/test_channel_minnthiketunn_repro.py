"""Reproduction test for Audience Intent Miner channel lookup for @MinnThikeTunn."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_channel_intent_distribution_for_minnthiketunn():
    response = client.get("/api/v1/creator/channel-intent-distribution?channel_handle=@MinnThikeTunn")
    assert response.status_code == 200
    data = response.json()

    print("RESPONSE DATA:", data)

    # Real assertion for a channel with 0 public comments: total_comments_analyzed must be 0
    assert data["total_comments_analyzed"] == 0, f"Expected 0 comments for @MinnThikeTunn, got {data.get('total_comments_analyzed')}"
    assert len(data["distribution"]) == 4
