---
name: youtube-api-quota-enricher
description: YouTube Data API v3 quota optimization and metadata enrichment guidance. Use this skill whenever building, modifying, or debugging YouTube API calls, 50-ID dual-endpoint batching (`videos.list` and `channels.list`), daily 10,000 unit quota management, local DB caching, `QUOTA_PAUSED` job status handling, or Midnight PST auto-resume mechanisms.
---

# YouTube API Quota Enricher

This skill provides comprehensive instructions for batch-enriching YouTube watch history data while strictly managing YouTube Data API v3 daily quota limits (10,000 units/day).

## 1. Core Architecture & Batching Strategy

To avoid quota exhaustion when processing multi-thousand record watch histories, **NEVER** call the YouTube Data API per video ID. Always use **50-ID dual-endpoint batching**.

```
[ Un-enriched Video IDs ]
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Local Database Cache Lookup (0 Quota Units)             │
│    Query DB for existing EnrichedVideo & EnrichedChannel    │
└──────────┬──────────────────────────────────────────────────┘
           │ (Only un-cached IDs remain)
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Dual-Endpoint 50-ID Batched Lookups                     │
│    a) Step 1: videos.list (Up to 50 video IDs / call)      │
│       part=snippet,contentDetails,topicDetails              │
│       Cost: 1 quota unit per 50-ID request                  │
│                                                             │
│    b) Step 2: Extract distinct channel_ids from video resp │
│       channels.list (Up to 50 channel IDs / call)           │
│       part=snippet,topicDetails                             │
│       Cost: 1 quota unit per 50-ID request                  │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Persist to Local DB & Cache                              │
│    Save EnrichedVideo & EnrichedChannel ORM models          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. API Endpoint Specifications

### Step A: `videos.list` Batch Endpoint
- **URL**: `GET https://www.googleapis.com/youtube/v3/videos`
- **Params**:
  - `id`: Comma-separated list of up to 50 video IDs (e.g. `id1,id2,...,id50`).
  - `part`: `snippet,contentDetails,topicDetails`
- **Fields Retained**:
  - `snippet.title`: Video title
  - `snippet.description`: Video description
  - `snippet.channelId`: Channel ID for dual lookups
  - `snippet.categoryId`: YouTube category ID
  - `contentDetails.duration`: ISO 8601 duration string (parsed to seconds)
  - `topicDetails.topicCategories`: Wikipedia topic URLs
- **Quota Cost**: Exactly **1 unit** per call for up to 50 IDs.

### Step B: `channels.list` Batch Endpoint
Video metadata alone does **not** include the channel's description. A separate batched call is required to obtain channel context for accurate semantic embeddings.

- **URL**: `GET https://www.googleapis.com/youtube/v3/channels`
- **Params**:
  - `id`: Comma-separated list of up to 50 **distinct** channel IDs collected from Step A.
  - `part`: `snippet,topicDetails`
- **Fields Retained**:
  - `snippet.title`: Channel title
  - `snippet.description`: Channel description
  - `topicDetails.topicCategories`: Wikipedia topic URLs for the channel
- **Quota Cost**: Exactly **1 unit** per call for up to 50 channel IDs.

> [!IMPORTANT]
> **Legacy Field Avoidance**: Do NOT use `topicIds` or `relevantTopicIds`. These fields were tied to the deprecated Google Freebase service and return empty or negligible data on modern YouTube videos. Rely exclusively on `topicCategories`.

---

## 3. Local Caching & Quota Math

Before executing any external HTTP request:
1. Query `EnrichedVideo` by `video_id`.
2. Query `EnrichedChannel` by `channel_id`.
3. Only request IDs from the API that do not exist in local cache.

### Quota Efficiency Calculation
- **Raw / Unbatched**: 1,000 video lookups = 1,000 quota units.
- **50-ID Batched + Cached**:
  - 1,000 videos = 20 `videos.list` calls + ~10 `channels.list` calls = **30 quota units**.
  - **Efficiency gain**: Up to **33x to 50x reduction** in quota consumption.

---

## 4. Quota Pause & Midnight PST Resumption

YouTube Data API quotas reset daily at **00:00 PST (Pacific Standard Time)** / **08:00 UTC**.

When an HTTP 403 response with reason `quotaExceeded` is received:
1. Immediately halt further API requests.
2. Mark the current active job state as `QUOTA_PAUSED`.
3. Calculate seconds remaining until 00:00 PST:
   ```python
   from datetime import datetime, timezone, timedelta

   def seconds_until_midnight_pst() -> int:
       pst = timezone(timedelta(hours=-8))
       now = datetime.now(pst)
       tomorrow = now.date() + timedelta(days=1)
       midnight = datetime.combine(tomorrow, datetime.min.time(), tzinfo=pst)
       return int((midnight - now).total_seconds())
   ```
4. Schedule the queue worker task to auto-resume execution after the computed delay.

---

## 5. Defensive Implementation Pattern (FastAPI / Python)

```python
import httpx
import re
from typing import List, Dict, Any

def parse_iso8601_duration(duration_str: str) -> int:
    """Parses ISO 8601 duration (e.g. PT1H2M10S) to total seconds."""
    pattern = re.compile(r'PT(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?')
    match = pattern.match(duration_str)
    if not match:
        return 0
    parts = match.groupdict(default=0)
    return int(parts['hours']) * 3600 + int(parts['minutes']) * 60 + int(parts['seconds'])

async def fetch_video_batch(video_ids: List[str], api_key: str) -> List[Dict[str, Any]]:
    """Fetches up to 50 videos in 1 quota unit."""
    if not video_ids or len(video_ids) > 50:
        raise ValueError("Batch size must be between 1 and 50 IDs.")
    
    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "id": ",".join(video_ids),
        "part": "snippet,contentDetails,topicDetails",
        "key": api_key
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, timeout=10.0)
        if resp.status_code == 403 and "quotaExceeded" in resp.text:
            raise QuotaExceededException("Daily YouTube API quota exhausted.")
        resp.raise_for_status()
        return resp.json().get("items", [])
```
