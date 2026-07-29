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
            video_id = cls.extract_video_id(title_url) if rec_type == RecordType.VIDEO else None

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
