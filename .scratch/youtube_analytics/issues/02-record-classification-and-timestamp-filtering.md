# 02 — Record Classification & Timestamp Filtering Engine

**What to build:**
Implement the `EntryClassifier` service to parse raw `watch-history.json` objects and categorize every record into `RecordType` enum values:
- `VIDEO`: `titleUrl` contains `watch?v=`.
- `COMMUNITY_POST`: `titleUrl` contains `/post/` OR title begins with "Viewed" without a video ID.
- `AD`: Title matches "Viewed Ads On YouTube Homepage" or `details.name` == "From Google Ads".
- `NON_VIEWING_ACTIVITY`: Title begins with "Used" (Shorts creation) or "Visited" (ad redirects).
- `INACCESSIBLE_VIDEO`: `watch?v=` present but API lookup returns no item.

**Core Requirement:**
Classification runs as the first pass on all raw records. `COMMUNITY_POST`, `AD`, and `NON_VIEWING_ACTIVITY` records are strictly removed from the timestamp sequence *before* consecutive time-gap processing, preventing time-clustered community post view bursts from corrupting downstream watch-probability metrics. Classified `VIDEO` records are bulk-saved to SQLite `raw_records`.

**Blocked by:** 01 — Greenfield Infrastructure & End-to-End Upload Ingestion

**Status:** completed

- [x] `EntryClassifier.classify_record()` handles all 5 `RecordType` enum cases.
- [x] `EntryClassifier.filter_video_records()` isolates `VIDEO` events and strips Community Posts, Ads, and Non-Viewing entries from timestamp sequences.
- [x] `EntryClassifier.extract_video_id()` correctly parses video IDs from `titleUrl` strings.
- [x] Classified records bulk-inserted into `raw_records` table linked to `job_id`.
- [x] `Job` model updated with `video_records`, `community_post_records`, `ad_records`, `non_viewing_records` counts.
- [x] Unit tests pass against sample 15,100 record Takeout dataset verifying ~4.6% non-video records are filtered without timestamp sequence leaks.
