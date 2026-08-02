import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Job
from app.services.goal_alignment import RecommendationEngine

def test_fetch_gemini_discovery_channels_user_api_key():
    # Verify user_api_key parameter is accepted and used in request
    with patch("httpx.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": '[{"channel_title": "Test Dev Channel", "channel_description": "Learn coding", "similarity_score": 0.95, "channel_url": "https://youtube.com/@testdev"}]'
                    }]
                }
            }]
        }
        mock_post.return_value = mock_response

        res = RecommendationEngine.fetch_gemini_discovery_channels("Software Engineering", user_api_key="TEST_USER_KEY_123")

        assert len(res) == 1
        assert res[0]["channel_title"] == "Test Dev Channel"
        assert mock_post.called
        call_url = mock_post.call_args[0][0]
        assert "key=TEST_USER_KEY_123" in call_url
