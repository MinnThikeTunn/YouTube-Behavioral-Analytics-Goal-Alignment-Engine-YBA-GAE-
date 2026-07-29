---
name: takeout-json-data-pipeline
description: Google Takeout watch-history.json parsing, pre-filtering, and behavioral proxy metrics computation guidance. Use this skill whenever working on JSON upload ingestion, entry classification (filtering Community Posts `/post/`, Ads, and Shorts tool usage), inter-click timestamp gap calculation, Focus Ratio, Completion Probability, Session Density, or Circadian Score formulas.
---

# Takeout JSON Data Pipeline & Proxy Metrics Engine

This skill provides comprehensive instructions for ingesting, classifying, pre-filtering Google Takeout `watch-history.json` files and mathematically computing behavioral proxy metrics in the absence of exact watch-duration data.

## 1. Raw Takeout Ingestion & Pre-Filtering

Google Takeout exports (`watch-history.json`) contain mixed activity records. Left unfiltered, non-video entries distort gap-based engagement metrics.

### Record Classification Rules

Every record MUST be classified before running any enrichment or metric calculation:

| Record Type | Identification Criteria | Action |
| :--- | :--- | :--- |
| **`VIDEO`** | `titleUrl` contains `watch?v=` | **KEEP**. Proceed to API enrichment & behavioral metric calculation. |
| **`COMMUNITY_POST`** | `titleUrl` contains `/post/` OR title begins with `Viewed post` | **FILTER OUT**. No video ID exists. Exclude from timestamp gap sequence. |
| **`AD`** | No `titleUrl` AND (`title` contains `Viewed Ads` OR `details` contains `From Google Ads`) | **FILTER OUT**. Exclude from sequence. |
| **`NON_VIEWING_ACTIVITY`** | `title` contains `Used Shorts creation tools` OR `Visited` | **FILTER OUT**. Exclude from sequence. |

> [!WARNING]
> Empirical analysis of a 15,100-record real Takeout export revealed ~2.8% Community Posts and ~1.7% Ads tightly time-clustered at identical timestamps. Failing to filter these produces artificial 0-second gaps that severely corrupt Completion Probability metrics.

---

## 2. Behavioral Proxy Metrics Formulas

Because `watch-history.json` only logs the **click timestamp** ($t_n$) and NOT the watch duration, engagement must be calculated using mathematical proxies:

### 1. Inter-Click Gap ($\Delta t_n$)
$$\Delta t_n = t_{n+1} - t_n$$
* **Session Boundary Cutoff**: If $\Delta t_n > 1800 \text{ seconds (30 mins)}$, treat $t_{n+1}$ as the start of a new session and exclude $\Delta t_n$ from video completion calculations.

### 2. Completion Probability ($P_n$)
Estimates whether a video of duration $D_n$ (seconds) was watched to completion:
$$P_n = \min\left(1.0, \frac{\Delta t_n}{D_n}\right)$$
* If $\Delta t_n > 1800$, $P_n$ is omitted or marked as unknown (session end).

### 3. Session Density ($D_{\text{session}}$)
Measures context-switching or rapid "doomscrolling":
$$D_{\text{session}} = \frac{\text{Total Video Clicks in Session}}{\text{Session Duration (Hours)}}$$
* **Threshold**: $> 15 \text{ clicks/hour}$ indicates rapid browsing / low focus retention.

### 4. Focus Ratio ($FR$)
$$FR = \frac{\text{Count of Aligned Video Clicks}}{\text{Total Video Clicks}} \times 100$$

### 5. Circadian Score ($CS$)
Evaluates late-night media consumption impact on sleep hygiene:
$$CS = \frac{\text{Count of Video Clicks between 11:00 PM and 05:00 AM}}{\text{Total Video Clicks}} \times 100$$

---

## 3. Python Data Processing Implementation

```python
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

def classify_record_type(item: Dict[str, Any]) -> str:
    title_url = item.get("titleUrl", "")
    title = item.get("title", "")
    details = item.get("details", [])
    
    if "watch?v=" in title_url:
        return "VIDEO"
    elif "/post/" in title_url or title.startswith("Viewed post"):
        return "COMMUNITY_POST"
    elif not title_url or "Viewed Ads" in title or any(d.get("name") == "From Google Ads" for d in details):
        return "AD"
    else:
        return "NON_VIEWING_ACTIVITY"

def process_takeout_items(raw_items: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """Filters records and returns valid video entries alongside record counts."""
    video_records = []
    counts = {"total": len(raw_items), "VIDEO": 0, "COMMUNITY_POST": 0, "AD": 0, "NON_VIEWING_ACTIVITY": 0}
    
    for item in raw_items:
        rtype = classify_record_type(item)
        counts[rtype] += 1
        if rtype == "VIDEO":
            # Extract video ID from URL
            url = item["titleUrl"]
            video_id = url.split("v=")[1].split("&")[0]
            video_records.append({
                "video_id": video_id,
                "timestamp": item["time"],
                "raw_title": item.get("title", "")
            })
            
    # Sort chronologically by timestamp
    video_records.sort(key=lambda x: x["timestamp"])
    return video_records, counts
```
