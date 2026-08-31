# YouTube Behavioral Analytics & Goal Alignment Predictor - Domain Context

## Glossary & System Terminology

### Core Domain Entities
- **Live Extension Telemetry Stream**: Real-time video watch events streamed directly from the Chrome/browser extension (`/api/v1/sync/stream` and `/api/v1/sync/stream/batch`) capturing video ID, title, channel name, dwell time, and navigation timestamps.
- **Job (`Job`)**: An analytics session tracking real-time telemetry streams, semantic vector embeddings, behavioral proxy metrics, and Creator Intelligence analytics.

### Entry Classification Types
- **Video Event**: A live YouTube video watch event containing a valid `video_id`. Eligible for inter-click gap calculations, semantic vector scoring, and YouTube Data API v3 metadata enrichment.
- **Community Post**: Community tab interactions without a video ID. Excluded before timestamp-gap computation to prevent artificial zero-gap inflation.
- **Ad Impression**: Promotional homepage/banner records filtered out from cognitive velocity calculations.
- **Non-Viewing Activity**: App interactions (e.g. Shorts creation tools, external URL click-throughs) filtered out.
- **Inaccessible Video**: Video event where `videos.list` returns no metadata (deleted or private video). Excluded from metadata enrichment but retained in raw activity counts.

### Proxy Metrics
- **Completion Probability ($P_n$)**: Proxy estimate $\min(1.0, (t_{n+1} - t_n) / D_n)$ of whether a video was watched to completion, where $t$ is timestamp and $D$ is video duration.
- **Focus Ratio ($FR$)**: Percentage of video click events that align with the user's stated goal.
- **Session Density ($SD$)**: Rate of video click events per hour within an active viewing session (flagged if $> 15 \text{ clicks/hour}$).
- **Circadian Score ($CS$)**: Percentage of viewing activity occurring late-night (11:00 PM – 5:00 AM local time).
- **Goal Alignment Probability Score**: Unsupervised composite score (0–100%) deriving semantic vector cosine similarity between goal text and weighted channel/video metadata.
- **Hourly Goal Alignment Score**: 24-hour breakdown ($h \in [0..23]$) representing the average semantic cosine similarity of video events watched within each local time hour, paired with total hourly click counts.

- **Canonical Topic Category**: Standardized high-level viewing domains (*Gaming*, *Entertainment*, *Sports*, *Software & Technology*, *Music*, *News*, *Education/Tutorials*, *Other*) mapped from API metadata or title vector embeddings.
- **Hybrid Category Classifier**: Classification strategy using YouTube API `categoryId` and `topicCategories` when available, falling back to title vector similarity matching against category prompt embeddings when API metadata is unavailable.

### Recommendation Entities
- **Hybrid Recommendation Engine**: Dual-stream recommendation system combining vector cosine similarity ranking on past watch history (`Watched Channels`) with LLM/curated discovery (`New Discovery`).
- **Watched Channel Recommendation**: Internal ranking of channels existing within the user's live stream history, evaluated by calculating vector embedding similarities between the target goal and channel title/descriptions.
- **New Discovery Recommendation**: External channel suggestions generated via Gemini API (or domain fallback) for target goals, cached globally by `goal_text` to enforce single-invocation efficiency across multiple jobs.

### Intervention & Nudge Entities
- **Behavioral Nudge Rule Engine**: Hybrid threshold-based and LLM-synthesized evaluation system generating actionable warnings (*Switching Threshold Alert*, *Focus Goal Goalpost*, *Late-Night Viewing Warning*) based on exact metrics and math, enhanced by Gemini API tailored phrasing when available.
- **Focus Goal Goalpost**: Quantified behavioral target calculating exact count of non-aligned video clicks to swap with goal-aligned content to elevate `Focus Ratio` to a target percentage.

### Real-Time Extension & Telemetry Entities
- **Chrome Extension Agent (MV3)**: Lightweight browser extension running DOM scraping scripts on `youtube.com` and a Manifest V3 background service worker with 20-second WebSocket keepalive heartbeats.
- **Real-Time Stream Receiver (`/api/v1/sync/stream`)**: FastAPI endpoint receiving real-time watch heartbeats (video ID, title, channel name, dwell seconds, DOM tags) and running sub-12ms ONNX INT8 quantized vector cosine similarity scoring.
- **1-Click History Backfill**: Rapid browser history ingestion mechanism extracting recent 50 video events from Chrome history (`POST /api/v1/sync/stream/batch`) to eliminate cold-start empty dashboard friction.
- **Focus Break / Snooze Pass**: Time-boxed temporary suppression (30 mins) of active Focus Shield toast alerts, displaying an ambient break badge while retaining background watch telemetry.
- **Goal-to-Playlist Bridge**: Dynamic playlist generator converting top-scoring educational video candidates into direct YouTube watch queues (`https://www.youtube.com/watch_videos?video_ids=...`).
- **Shadow DOM Focus Shield**: Isolated overlay modal (`attachShadow({ mode: 'open' })`) injected into YouTube's `ytd-app` DOM to display floating alignment pills and shield nudges when alignment drops below configured threshold.
- **Broadcaster Hub (`ws://.../api/v1/ws/live`)**: WebSocket manager pushing real-time session velocity, live activity events, and updated focus scores to the React Web Dashboard.

### Creator Intelligence Mode Entities
- **Audience Intent Classifier**: Zero-shot NLP comment clustering engine (`commentThreads.list` at 1 unit quota per 100 comments) extracting qualitative viewer demand buckets (*Planning trip*, *Budget travel*, *Tutorial request*).
- **Hierarchical Niche Trend Radar**: Dynamic momentum metric $T_i = w_1 \cdot \text{ViewGrowth} + w_2 \cdot \text{Velocity} + w_3 \cdot \text{Engagement} - w_4 \cdot \text{Saturation}$ ranking subtopic velocity in creator niches.
- **Video Opportunity Score ($VOS$)**: Composite ROI score ($VOS \in [0..100]$) identifying high-demand missing topics by evaluating trend momentum, audience interest, channel relevance, and competitor saturation.
- **Viewer Attraction Score ($VAS$)**: Pre-publish packaging score ($VAS = 0.25 \cdot T_{trend} + 0.20 \cdot G_{match} + 0.20 \cdot Title + 0.20 \cdot Visual + 0.15 \cdot Hook$) synthesizing title NLP, OpenCV thumbnail vision readability, and hook script retention.
- **Multi-Variant A/B Packaging Matrix**: Pre-publish simulation matrix evaluating up to 3 candidate titles and multiple thumbnails concurrently to compute comparative VAS rankings and predicted CTR delta.
- **AI Hook Script Generator**: NLP retention drafting engine generating 30-second speech-paced scripts (60-90 words) designed for peak initial viewer retention.

## Architecture Decision Records (ADRs)

### ADR-001: Phase-by-Phase Iterative Roadmap Rollout
- **Status:** Accepted
- **Context:** `docs/FEATURE_ROADMAP.md` spans 4 major platform phases across Viewer real-time intervention, behavioral velocity, Creator Mode intent engines, and package optimization.
- **Decision:** Execute rollout iteratively starting with **Phase 1 (Chrome Extension Agent + FastAPI Stream + Shadow DOM Focus Shield)** to establish live YouTube DOM telemetry before building downstream analytics.

### ADR-002: Standalone `/extension` Directory with Vanilla JS/CSS
- **Status:** Accepted
- **Context:** The Manifest V3 Chrome Extension needs to be easy to inspect, fast to develop, and installable into Chrome without build overhead.
- **Decision:** Maintain a standalone `/extension` folder containing raw Manifest V3 files (`manifest.json`, `content.js`, `background.js`, `styles.css`) for zero-build "Load Unpacked" development.

### ADR-003: Dual-Engine Vector Embeddings (ONNX INT8 Quantization)
- **Status:** Accepted
- **Context:** Sub-50ms latency is required for real-time streaming heartbeats without blocking FastAPI event loops.
- **Decision:** Implement ONNX Runtime INT8 dynamic quantization for sub-12ms embedding scoring on `/api/v1/sync/stream`, with automatic fallback to PyTorch `sentence-transformers`.

### ADR-004: SQLite WAL Concurrency & Safe Atomic Merges
- **Status:** Accepted
- **Context:** High-frequency extension stream heartbeats and background JSON uploads collided on SQLite database locks, causing `PendingRollbackError` and unique constraint collisions.
- **Decision:** Enforce `PRAGMA journal_mode = WAL;`, `PRAGMA busy_timeout = 5000;`, and wrap all metric mutations in explicit atomic `db.rollback()` exception handlers.

### ADR-005: CORS Whitelisting & In-Memory Key Masking
- **Status:** Accepted
- **Context:** Wildcard CORS and plaintext API key disk storage exposed potential security risks.
- **Decision:** Restrict CORS strictly to `localhost:3000`, `localhost:5173`, and `chrome-extension://*`, while masking sensitive credentials in persisted database models.




