# 2. Dual-Mode YouTube Data API Key Management & Quota Enforcement

* **Status:** Accepted
* **Date:** 2026-07-29

## Context and Problem Statement
The YouTube Data API v3 enforces a default daily quota limit of 10,000 units. While dual 50-ID batching efficiently processes up to ~250,000 videos/day, multi-user local usage or massive Takeout exports could approach the daily threshold.

## Decision Drivers
- Seamless zero-configuration setup for standard users.
- Flexibility for power users processing large datasets.
- Graceful degradation when quota limits are reached.

## Considered Options
1. Server-side API Key only (`.env`).
2. Dual-mode: Server `.env` API Key with optional user-supplied key in upload UI.

## Decision Outcome
Chosen Option: **2. Dual-mode: Server `.env` API Key with optional user-supplied key in upload UI**.

### System Behavior
- Default: Backend uses `YOUTUBE_API_KEY` defined in `backend/.env`.
- Override: Users can optionally provide their own YouTube API Key in the frontend `FileUploaderComponent` / `GoalSelector`.
- Quota Exhaustion (`QUOTA_PAUSED`): If quota reaches 9,500 units, processing pauses until Midnight PST reset. Partial metrics computed up to the pause point remain viewable in the dashboard.
