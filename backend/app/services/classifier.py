import re
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
from app.db.models import RecordType

class EntryClassifier:
    @staticmethod
    def extract_video_id(url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        match = re.search(r"[?&]v=([a-zA-Z0-9_-]{11})", url)
        if match:
            return match.group(1)
        return None

    @staticmethod
    def extract_channel_info(subtitles: Optional[List[Dict[str, Any]]]) -> Tuple[Optional[str], Optional[str]]:
        """Extracts channel_id and channel_title directly from video metadata array."""
        if not subtitles or not isinstance(subtitles, list) or len(subtitles) == 0:
            return None, None
        sub = subtitles[0]
        if not isinstance(sub, dict):
            return None, None
        name = sub.get("name")
        url = sub.get("url", "")
        cid = None
        if url:
            match = re.search(r"/(?:channel|c|user|@)/([a-zA-Z0-9_-]+)", url)
            if match:
                cid = match.group(1)
            elif "channel/" in url:
                cid = url.split("channel/")[-1].split("/")[0]
        return cid, name

    @classmethod
    def classify_record(cls, raw: Dict[str, Any]) -> RecordType:
        title = raw.get("title", "")
        title_url = raw.get("titleUrl", "")
        details = raw.get("details", [])

        # Check for Ad impressions
        if title == "Viewed Ads On YouTube Homepage":
            return RecordType.AD
        for d in details:
            if isinstance(d, dict) and d.get("name") == "From Google Ads":
                return RecordType.AD

        # Check for Community Posts
        if title_url and "/post/" in title_url:
            return RecordType.COMMUNITY_POST
        if (title.startswith("Viewed ") or title.startswith("Viewed")) and not cls.extract_video_id(title_url):
            return RecordType.COMMUNITY_POST

        # Check for Non-viewing activity
        if title.startswith("Used ") or title.startswith("Visited "):
            return RecordType.NON_VIEWING_ACTIVITY

        # Check for Video event
        if title_url and ("watch?v=" in title_url or cls.extract_video_id(title_url)):
            return RecordType.VIDEO

        # Default fallback for records without video ID
        return RecordType.NON_VIEWING_ACTIVITY

    @classmethod
    def process_and_classify_records(cls, raw_records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """
        Classifies all raw records and filters video events into a clean timestamp sequence.
        Returns:
            - List of classified record dicts suitable for RawRecord ORM creation.
            - Dict of record counts per type.
        """
        classified_list: List[Dict[str, Any]] = []
        counts = {
            "total": len(raw_records),
            "video": 0,
            "community_post": 0,
            "ad": 0,
            "non_viewing": 0
        }

        for raw in raw_records:
            rec_type = cls.classify_record(raw)
            raw_title = raw.get("title", "")
            title_url = raw.get("titleUrl")
            subtitles = raw.get("subtitles")
            video_id = cls.extract_video_id(title_url) if rec_type == RecordType.VIDEO else None
            channel_id, channel_title = cls.extract_channel_info(subtitles)

            # Parse ISO timestamp
            time_str = raw.get("time", "")
            try:
                ts = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.utcnow()

            classified_list.append({
                "timestamp": ts,
                "raw_title": raw_title,
                "title_url": title_url,
                "video_id": video_id,
                "channel_id": channel_id,
                "channel_title": channel_title,
                "record_type": rec_type
            })

            if rec_type == RecordType.VIDEO:
                counts["video"] += 1
            elif rec_type == RecordType.COMMUNITY_POST:
                counts["community_post"] += 1
            elif rec_type == RecordType.AD:
                counts["ad"] += 1
            else:
                counts["non_viewing"] += 1

        # Sort all records strictly by timestamp ascending
        classified_list.sort(key=lambda x: x["timestamp"])

        return classified_list, counts


CANONICAL_CATEGORIES = {
    "Gaming": {"color": "#6366F1", "keywords": ["game", "gaming", "gameplay", "walkthrough", "stream", "playstation", "xbox", "nintendo", "minecraft", "roblox", "gta", "valheim", "steam"]},
    "Entertainment": {"color": "#EC4899", "keywords": ["movie", "trailer", "show", "entertainment", "comedy", "funny", "reaction", "vlog", "prank", "drama", "anime", "series"]},
    "Sports": {"color": "#10B981", "keywords": ["sport", "sports", "football", "soccer", "basketball", "nba", "highlights", "boxing", "ufc", "wwe", "tennis", "formula 1", "f1"]},
    "Software & Technology": {"color": "#3B82F6", "keywords": ["code", "coding", "python", "javascript", "react", "fastapi", "software", "tech", "engineering", "developer", "ai", "machine learning", "programming", "api", "database", "linux", "system design"]},
    "Music": {"color": "#8B5CF6", "keywords": ["music", "song", "audio", "lyric", "lyrics", "official video", "album", "remix", "track", "concert", "beat", "piano", "guitar"]},
    "News": {"color": "#F59E0B", "keywords": ["news", "politics", "live", "report", "breaking", "update", "today", "journalism", "interview", "podcast", "world"]},
    "Education / Tutorials": {"color": "#14B8A6", "keywords": ["tutorial", "how to", "course", "lecture", "explained", "learn", "guide", "math", "science", "history", "physics", "crash course"]},
    "Other": {"color": "#94A3B8", "keywords": []}
}

YOUTUBE_CATEGORY_ID_MAP = {
    "20": "Gaming",
    "24": "Entertainment",
    "17": "Sports",
    "28": "Software & Technology",
    "27": "Education / Tutorials",
    "10": "Music",
    "25": "News",
    "26": "Education / Tutorials",
    "22": "Entertainment",
    "1": "Entertainment",
    "2": "Sports",
    "15": "Entertainment"
}

class TopicClassifier:
    @classmethod
    def classify_topic(
        cls,
        category_id: Optional[str] = None,
        topic_categories_json: Optional[str] = None,
        raw_title: str = ""
    ) -> str:
        # 1. YouTube Category ID Lookup
        if category_id and str(category_id) in YOUTUBE_CATEGORY_ID_MAP:
            return YOUTUBE_CATEGORY_ID_MAP[str(category_id)]

        # 2. Topic Categories Wikipedia URL inspection
        if topic_categories_json:
            try:
                import json
                topics = json.loads(topic_categories_json) if isinstance(topic_categories_json, str) else topic_categories_json
                if isinstance(topics, list):
                    topic_str = " ".join(topics).lower()
                    if "gaming" in topic_str or "action_game" in topic_str:
                        return "Gaming"
                    if "sport" in topic_str:
                        return "Sports"
                    if "music" in topic_str:
                        return "Music"
                    if "news" in topic_str or "politics" in topic_str:
                        return "News"
                    if "software" in topic_str or "technology" in topic_str or "computer" in topic_str:
                        return "Software & Technology"
                    if "knowledge" in topic_str or "education" in topic_str:
                        return "Education / Tutorials"
                    if "entertainment" in topic_str or "society" in topic_str or "film" in topic_str:
                        return "Entertainment"
            except Exception:
                pass

        # 3. Keyword / Title Matching Fallback
        t_clean = raw_title.lower()
        if t_clean.startswith("watched "):
            t_clean = t_clean[8:]

        for cat_name, cat_meta in CANONICAL_CATEGORIES.items():
            if cat_name == "Other":
                continue
            for kw in cat_meta["keywords"]:
                if kw in t_clean:
                    return cat_name

        return "Other"

