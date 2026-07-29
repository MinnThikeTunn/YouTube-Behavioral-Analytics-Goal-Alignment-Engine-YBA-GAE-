# 03 — Batched YouTube API Metadata Enrichment & Quota Manager

**What to build:**
Implement `YouTubeAPIService` and `QuotaManager` to enrich `VIDEO` records via the YouTube Data API v3:
1. **Dual 50-ID Batching:**
   - Call `videos.list` (`part=snippet,contentDetails,topicDetails`) in batches of up to 50 video IDs per call.
   - Collect unique `channelId` values and call `channels.list` (`part=snippet,topicDetails`) in batches of up to 50 channel IDs per call.
2. **Quota Management:** `QuotaManager` tracks unit usage against the daily 10,000-unit limit. If usage hits 9,500 units, the system transitions `Job.status` to `QUOTA_PAUSED` and schedules auto-resume after midnight PST.
3. **Dual API Key Support:** System checks for user-supplied `api_key` in request headers, falling back to server `YOUTUBE_API_KEY` in `.env`.
4. **Persistence:** Enriched data saved to SQLite `enriched_videos` and `enriched_channels`.

**Blocked by:** 02 — Record Classification & Timestamp Filtering Engine

**Status:** completed

- [x] `YouTubeAPIService.batch_fetch_videos()` groups up to 50 video IDs per network call.
- [x] `YouTubeAPIService.batch_fetch_channels()` groups up to 50 distinct channel IDs per network call.
- [x] ISO 8601 duration string parser correctly converts `PT15M33S` to 933 integer seconds.
- [x] `QuotaManager.track_usage()` enforces daily 10,000 limit and transitions status to `QUOTA_PAUSED` at 9,500 units.
- [x] Support for user-provided API key header alongside server `.env` key.
- [x] `EnrichedVideo` and `EnrichedChannel` records cached in SQLite DB.
- [x] Integration test with mocked Google API responses verifies 1,000 video IDs require exactly 20 `videos.list` and <=20 `channels.list` calls (total <=40 quota units).
