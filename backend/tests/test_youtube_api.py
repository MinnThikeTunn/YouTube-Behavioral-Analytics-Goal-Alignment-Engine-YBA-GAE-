import pytest
from unittest.mock import MagicMock, patch
from app.services.youtube_api import parse_iso8601_duration, YouTubeAPIService, QuotaExceededException
from app.services.quota_manager import QuotaManager

def test_parse_iso8601_duration():
    assert parse_iso8601_duration("PT15M33S") == 933
    assert parse_iso8601_duration("PT1H2M5S") == 3725
    assert parse_iso8601_duration("PT45S") == 45
    assert parse_iso8601_duration("P1DT2H") == 93600
    assert parse_iso8601_duration(None) == 0
    assert parse_iso8601_duration("INVALID") == 0

def test_quota_manager_limit():
    qm = QuotaManager()
    assert qm.check_quota_available(10) is True
    
    qm.cumulative_units = 9495
    assert qm.check_quota_available(10) is False
    assert qm.track_usage(10) is False

def test_youtube_api_batching():
    qm = QuotaManager()
    service = YouTubeAPIService(api_key="TEST_KEY", quota_manager=qm)
    
    # Generate 120 dummy video IDs
    video_ids = [f"vid_{i:03d}" for i in range(120)]
    
    mock_execute = MagicMock(return_value={
        "items": [
            {
                "id": "vid_000",
                "snippet": {
                    "title": "Test Video",
                    "description": "Test Desc",
                    "channelId": "chan_001",
                    "tags": ["test"],
                    "categoryId": "28"
                },
                "contentDetails": {"duration": "PT10M0S"},
                "topicDetails": {"topicCategories": ["https://en.wikipedia.org/wiki/Technology"]}
            }
        ]
    })
    
    mock_videos_list = MagicMock(return_value=MagicMock(execute=mock_execute))
    mock_client = MagicMock()
    mock_client.videos.return_value.list = mock_videos_list

    with patch.object(service, "_get_youtube_client", return_value=mock_client):
        results = service.batch_fetch_videos(video_ids)

        # 120 video IDs in 50-ID chunks = 3 API calls (50, 50, 20)
        assert mock_videos_list.call_count == 3
        assert qm.cumulative_units == 3
        assert len(results) > 0
        assert results[0]["video_id"] == "vid_000"
        assert results[0]["duration_seconds"] == 600
