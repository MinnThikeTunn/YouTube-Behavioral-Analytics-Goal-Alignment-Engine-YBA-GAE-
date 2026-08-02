# YouTube Behavioral Analytics & Goal Alignment Predictor - Domain Context

## Glossary & System Terminology

### Core Domain Entities
- **Watch History Export (`watch-history.json`)**: Raw JSON export provided by Google Takeout containing video click timestamps, titles, and title URLs.
- **Job (`Job`)**: An asynchronous processing session tracking file parsing, entry classification, API enrichment progress, and analytical metric computation.

### Entry Classification Types
- **Video Event**: A `watch-history.json` record with `titleUrl` containing `watch?v=`. The only record type eligible for timestamp-gap calculations and YouTube Data API v3 metadata enrichment.
- **Community Post**: Activity with `titleUrl` containing `/post/` or title starting with "Viewed" without a video ID. Strictly excluded before timestamp-gap computation to prevent artificial zero-gap inflation.
- **Ad Impression**: Promotional homepage/banner records. Filtered out entirely.
- **Non-Viewing Activity**: App interactions (e.g. Shorts creation tools, external URL click-throughs). Filtered out.
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
- **Watched Channel Recommendation**: Internal ranking of channels existing within the user's `watch-history.json`, evaluated by calculating vector embedding similarities between the target goal and channel title/descriptions.
- **New Discovery Recommendation**: External channel suggestions generated via Gemini API (or domain fallback) for target goals, cached globally by `goal_text` to enforce single-invocation efficiency across multiple jobs.

### Intervention & Nudge Entities
- **Behavioral Nudge Rule Engine**: Hybrid threshold-based and LLM-synthesized evaluation system generating actionable warnings (*Switching Threshold Alert*, *Focus Goal Goalpost*, *Late-Night Viewing Warning*) based on exact metrics and math, enhanced by Gemini API tailored phrasing when available.
- **Focus Goal Goalpost**: Quantified behavioral target calculating exact count of non-aligned video clicks to swap with goal-aligned content to elevate `Focus Ratio` to a target percentage.


