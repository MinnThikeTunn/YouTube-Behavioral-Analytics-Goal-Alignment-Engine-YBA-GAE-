import re
import json
import logging
import httpx
from typing import List, Dict, Any, Optional, Set
from app.config import settings
from app.services.quota_manager import global_quota_manager, QuotaManager

logger = logging.getLogger(__name__)

def parse_iso8601_duration(duration_str: Optional[str]) -> int:
    """
    Parses an ISO 8601 duration string (e.g., 'PT1H15M33S', 'PT15M33S', 'PT45S')
    into integer duration in seconds.
    """
    if not duration_str:
        return 0
    pattern = re.compile(r"P(?:(?P<days>\d+)D)?T?(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?")
    match = pattern.match(duration_str)
    if not match:
        return 0

    parts = match.groupdict()
    days = int(parts["days"] or 0)
    hours = int(parts["hours"] or 0)
    minutes = int(parts["minutes"] or 0)
    seconds = int(parts["seconds"] or 0)

    return days * 86400 + hours * 3600 + minutes * 60 + seconds

class QuotaExceededException(Exception):
    pass

class YouTubeAPIService:
    def __init__(self, api_key: Optional[str] = None, quota_manager: Optional[QuotaManager] = None):
        self.api_key = api_key or settings.YOUTUBE_API_KEY
        self.quota_manager = quota_manager or global_quota_manager

    def batch_fetch_videos(self, video_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Batches up to 50 video IDs per call to videos.list(part="snippet,contentDetails,topicDetails").
        Cost: 1 unit per 50 videos. Uses httpx with strict 5s timeout.
        """
        if not video_ids or not self.api_key:
            return []

        unique_ids = list(dict.fromkeys(video_ids))
        results: List[Dict[str, Any]] = []
        chunk_size = 50

        consecutive_errors = 0
        for i in range(0, len(unique_ids), chunk_size):
            if consecutive_errors >= 2:
                logger.warning("Multiple network timeouts encountered. Aborting API loop to fallback to local metadata cache.")
                break

            chunk = unique_ids[i:i + chunk_size]

            if not self.quota_manager.check_quota_available(1):
                logger.warning("Daily quota threshold reached during video batch lookup.")
                raise QuotaExceededException("YouTube API daily quota threshold reached.")

            try:
                url = "https://www.googleapis.com/youtube/v3/videos"
                params = {
                    "part": "snippet,contentDetails,topicDetails",
                    "id": ",".join(chunk),
                    "maxResults": 50,
                    "key": self.api_key
                }
                r = httpx.get(url, params=params, timeout=3.0)

                if r.status_code in [403, 429]:
                    logger.warning(f"YouTube API returned status {r.status_code}. Quota limit reached or forbidden.")
                    raise QuotaExceededException("YouTube API quota exceeded or forbidden.")

                if r.status_code == 200:
                    consecutive_errors = 0
                    response = r.json()
                    self.quota_manager.track_usage(1)
                    items = response.get("items", [])
                    for item in items:
                        v_id = item.get("id")
                        snippet = item.get("snippet", {})
                        content_details = item.get("contentDetails", {})
                        topic_details = item.get("topicDetails", {})

                        duration_seconds = parse_iso8601_duration(content_details.get("duration"))
                        tags = snippet.get("tags", [])
                        topic_categories = topic_details.get("topicCategories", [])

                        results.append({
                            "video_id": v_id,
                            "channel_id": snippet.get("channelId"),
                            "video_title": snippet.get("title", ""),
                            "video_description": snippet.get("description", ""),
                            "tags_json": json.dumps(tags),
                            "category_id": snippet.get("categoryId", ""),
                            "duration_seconds": duration_seconds,
                            "topic_categories_json": json.dumps(topic_categories)
                        })
                else:
                    consecutive_errors += 1
                    logger.warning(f"Non-200 response from YouTube API ({r.status_code}). Error count: {consecutive_errors}/2")
            except QuotaExceededException:
                raise
            except Exception as e:
                consecutive_errors += 1
                logger.warning(f"Error or timeout during YouTube video batch fetch ({consecutive_errors}/2): {e}")

        return results

    def batch_fetch_channels(self, channel_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Batches up to 50 distinct channel IDs per call to channels.list(part="snippet,topicDetails").
        Cost: 1 unit per 50 channels. Uses httpx with strict 5s timeout.
        """
        if not channel_ids or not self.api_key:
            return []

        unique_ids = list(dict.fromkeys([c for c in channel_ids if c]))
        if not unique_ids:
            return []

        results: List[Dict[str, Any]] = []
        chunk_size = 50

        for i in range(0, len(unique_ids), chunk_size):
            chunk = unique_ids[i:i + chunk_size]

            if not self.quota_manager.check_quota_available(1):
                logger.warning("Daily quota threshold reached during channel batch lookup.")
                raise QuotaExceededException("YouTube API daily quota threshold reached.")

            try:
                url = "https://www.googleapis.com/youtube/v3/channels"
                params = {
                    "part": "snippet,topicDetails",
                    "id": ",".join(chunk),
                    "maxResults": 50,
                    "key": self.api_key
                }
                r = httpx.get(url, params=params, timeout=5.0)

                if r.status_code in [403, 429]:
                    logger.warning(f"YouTube API returned status {r.status_code}. Quota limit reached or forbidden.")
                    raise QuotaExceededException("YouTube API quota exceeded or forbidden.")

                if r.status_code == 200:
                    response = r.json()
                    self.quota_manager.track_usage(1)
                    items = response.get("items", [])
                    for item in items:
                        c_id = item.get("id")
                        snippet = item.get("snippet", {})
                        topic_details = item.get("topicDetails", {})

                        topic_categories = topic_details.get("topicCategories", [])

                        results.append({
                            "channel_id": c_id,
                            "channel_title": snippet.get("title", ""),
                            "channel_description": snippet.get("description", ""),
                            "topic_categories_json": json.dumps(topic_categories)
                        })
            except QuotaExceededException:
                raise
            except Exception as e:
                logger.warning(f"Error or timeout during YouTube channel batch fetch: {e}")

        return results
