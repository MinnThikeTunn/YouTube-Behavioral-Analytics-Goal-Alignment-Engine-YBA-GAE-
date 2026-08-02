# Specification (PRD): AI-Driven YouTube Behavioral Analytics & Goal Alignment Predictor

**Version:** 1.0  
**Status:** Approved / Ready for Agent (`ready-for-agent`)  
**Target Stack:** React 18 (Vite, TypeScript, Tailwind CSS) + FastAPI (Python 3.10+, SQLite, `sentence-transformers`)
**Execution Mode:** Non-Containerized Native OS Execution  
**Design Aesthetic:** High-End Minimalist 'Perplexity' Aesthetic (`rounded-[32px]` containers, `font-black` headings, Dark/Light contrast mode, `[Observed]` vs `[Estimated]` metric badges)

---

## Problem Statement

Users who consume large volumes of YouTube content lack visibility into how their daily viewing habits align with their personal, academic, or professional goals (e.g., Software Engineering, Data Science, Health & Fitness). 

Key challenges faced by the user:
1. **Data Void in Exports:** Google Takeout exports (`watch-history.json`) contain only click timestamps and video title URLs—they do **not** record actual watch duration. Relying on raw video length grossly inflates engagement estimates.
2. **Data Noise & False Gaps:** `watch-history.json` contains non-video records (Community Post views, ad impressions, Shorts creation events, external URL redirects) which often occur in time-clustered bursts. Left unfiltered, these inject artificial near-zero timestamp gaps that corrupt session density and watch probability calculations.
3. **Keyword Ambiguity:** Simple keyword matching fails on polysemous terms (e.g., confusing "Python" the programming language with the reptile).
4. **Quota Exhaustion & Blocking UI:** Unbatched, synchronous metadata retrieval quickly exhausts YouTube API daily quota limits and causes web browser timeouts.
5. **No Manual Curation:** Users expect a self-serve "upload and immediately view insights" experience without having to manually tag videos or train classifiers.

---

## Solution

The **YouTube Behavioral Analytics & Goal Alignment Predictor** is a standalone, web-based analytics platform. It ingests a user's uploaded `watch-history.json`, performs immediate entry-type classification to strip non-video records, offloads processing to a native FastAPI background worker, enriches video metadata via dual 50-ID API batching, computes engagement proxy metrics (Completion Probability, Focus Ratio, Session Density, Circadian Score), and evaluates semantic goal alignment using unsupervised sentence-transformer embeddings (`all-MiniLM-L6-v2`). 

All results are presented via an interactive, Perplexity-styled dashboard with clear visual distinctions between observed data and estimated metrics.

---

## User Stories

1. As a user, I want to drag and drop my Google Takeout `watch-history.json` file onto the upload dropzone, so that I can analyze my viewing history without complex data transformation.
2. As a user, I want to select a predefined learning goal (e.g., "Software Engineering", "Data Science", "Health & Fitness") or enter a custom free-text goal, so that the system evaluates my viewing habits against my specific objectives.
3. As a user, I want to optionally provide my own YouTube Data API v3 Key during file upload, so that I can process large multi-year watch histories without waiting on shared server quota limits.
4. As a user, I want to receive an immediate response (`202 Accepted` with a `job_id`) upon uploading my file, so that my web browser remains responsive while background analysis runs.
5. As a user, I want to view real-time progress percentage and state updates (Queued, Processing, Paused, Completed) while my file is analyzed, so that I know the exact status of my job.
6. As a user, I want non-video records (Community Posts, Ads, Shorts creation entries) automatically stripped from my history before engagement calculation, so that my behavioral metrics accurately reflect video viewing rather than post scrolling.
7. As a user, I want deleted or private videos logged accurately in raw counts while excluded from metadata enrichment, so that my metrics are not corrupted by missing API data.
8. As a user, I want to view a Goal Alignment Probability Score (0–100%) on my dashboard, so that I can instantly evaluate how well my overall viewing habits support my stated objective.
9. As a user, I want to see a clear visual breakdown of my Focus Ratio (percentage of goal-aligned clicks vs total clicks), so that I know what proportion of my viewing time was productive.
10. As a user, I want to view a Completion Probability distribution for my watched videos, so that I can identify whether I skim videos or watch them through.
11. As a user, I want a 30-minute idle period automatically detected as a session boundary, so that multi-hour breaks between sessions do not distort my video completion estimates.
12. As a user, I want to view my Session Density metric (clicks per hour), so that I am alerted when I am engaging in rapid context-switching or doomscrolling (>15 clicks/hour).
13. As a user, I want to view my Circadian Score (percentage of clicks between 11:00 PM and 5:00 AM local time), so that I can assess whether late-night watching is impacting my sleep hygiene.
14. As a user, I want every metric on my dashboard clearly labeled with `[Observed Data]` or `[Derived Estimate]` badges, so that I can trust the data without confusing approximations with raw facts.
15. As a user, I want to see a ranked list of recommended high-alignment YouTube channels, so that I can replace low-value entertainment habits with productive content.
16. As a user, I want an interactive 24-hour circadian distribution chart, so that I can visually pinpoint peak watching hours across the day.
17. As a user, I want to toggle seamlessly between Ambient Dark Mode and Light Mode on the dashboard, so that the UI adapts to my preferred viewing environment.
18. As a user, I want the system to handle daily YouTube API quota limits gracefully (`QUOTA_PAUSED`) by displaying partial analytics computed up to the pause point, so that I still get value even if API limits are hit.
19. As a user, I want my uploaded files and processing data stored locally and encrypted at rest, so that my viewing habits remain strictly private.

---

## Implementation Decisions

### Architecture & Engine Decisions
- **Non-Containerized Native OS Execution:** The app runs directly on the host OS using standard Python virtual environments (`venv`) and Node.js (`npm`). No Docker or Redis daemons are required ([ADR 0001](file:///D:/DAProject/docs/adr/0001-fastapi-background-tasks.md)).
- **Background Processing:** Managed via native FastAPI `BackgroundTasks` with SQLite job state tracking ([ADR 0001](file:///D:/DAProject/docs/adr/0001-fastapi-background-tasks.md)).
- **Dual-Mode API Credentials:** Server `.env` default key + optional user API key override passed via HTTP request ([ADR 0002](file:///D:/DAProject/docs/adr/0002-youtube-api-key-dual-mode.md)).
- **Dual 50-ID API Batching:** 
  1. `videos.list` (`part=snippet,contentDetails,topicDetails`) in 50-ID batches for video title, description, tags, category, duration, and `topicCategories`.
  2. `channels.list` (`part=snippet,topicDetails`) in 50-ID batches for channel title, description, and channel `topicCategories`.
- **Unsupervised Semantic Embeddings:** PyTorch `sentence-transformers` model `all-MiniLM-L6-v2` generating 384-dimensional vector embeddings on local CPU ([ADR 0003](file:///D:/DAProject/docs/adr/0003-sentence-transformers-embeddings.md)).
- **Context-Weighted Metadata Payload:**
  - Channel Context (Title & Description): 40%
  - Topic Categories (`topicCategories` Wikipedia labels): 35%
  - Video Context (Title & Tags): 25%

### Database Schema (SQLite)
- `jobs`: Tracks job lifecycle (`QUEUED`, `PROCESSING`, `QUOTA_PAUSED`, `COMPLETED`, `FAILED`), progress %, goal text, and total/classified record counts.
- `raw_records`: Persists parsed click records with classification tag (`VIDEO`, `COMMUNITY_POST`, `AD`, `NON_VIEWING_ACTIVITY`, `INACCESSIBLE_VIDEO`).
- `enriched_videos` & `enriched_channels`: Local metadata cache for videos and channels.
- `computed_metrics`: Persists computed mathematical proxy metrics per job.
- `goal_alignment_scores`: Persists semantic alignment scores, weights, and penalties.

### API Contracts
- `POST /api/v1/upload`: Form-data submission (`file: UploadFile`, `goal_text: str`, `api_key: Optional[str]`). Returns `202 Accepted` with `UploadResponseDTO(job_id, status, created_at)`.
- `GET /api/v1/jobs/{job_id}/status`: Polling endpoint returning `JobStatusResponseDTO(job_id, status, progress_pct, total_records, video_records)`.
- `GET /api/v1/analytics/{job_id}`: Results endpoint returning `AnalyticsResultDTO(metrics, alignment_score, recommendations)`.

### Frontend UI & Design System
- **Framework:** React 18 + Vite + Tailwind CSS + Framer Motion + Recharts.
- **Aesthetic:** Perplexity Design System ([ADR 0004](file:///D:/DAProject/docs/adr/0004-perplexity-ui-design-system.md)):
  - `font-black` headings, clean sans-serif typography.
  - `rounded-[32px]` containers with soft dark/light borders (`border-slate-200/60 dark:border-zinc-800/80`).
  - Dark / Light contrast mode toggle.
  - Badges distinguishing `[Observed Data]` from `[Derived Estimate]`.

---

## Testing Decisions

### Seams & Boundaries
1. **Backend Integration Seam (Primary Seam):**
   - High-level API integration testing using `pytest` + FastAPI `TestClient` / `httpx.AsyncClient`.
   - Seam location: HTTP request endpoints (`POST /api/v1/upload`, `GET /api/v1/jobs/{job_id}/status`, `GET /api/v1/analytics/{job_id}`).
   - YouTube Data API v3 network calls are mocked at the `YouTubeAPIService` boundary.
2. **Proxy Engine & Embedding Seam:**
   - Isolated unit tests for `EntryClassifier`, `ProxyMetricsEngine`, and `GoalAlignmentEngine`.
   - Verification against real sample Takeout records (testing Community Post exclusion and 30-minute session boundary cutoffs).
3. **Frontend Component & API Client Seam:**
   - `vitest` + `@testing-library/react` tests mocking `ApiClient` responses.

### What Makes a Good Test
- Tests focus strictly on observable inputs and output contracts (e.g., verifying that a 15,100 record Takeout file produces correct classified counts and metrics).
- No mocking of internal SQLite tables or ORM internals; test through public service methods or API endpoints.

---

## Out of Scope

1. **Live YouTube Account Integration (OAuth 2.0):** No direct reading/writing to live YouTube user subscriptions or history; ingestion is strictly via manually uploaded Google Takeout files.
2. **Ground-Truth Learning Outcome Validation:** The system measures *content alignment*, not verified skill acquisition or academic test results.
3. **Docker Containerization:** Docker/Kubernetes setups are explicitly out of scope. Execution is native OS based.
4. **Video Content Streaming or Playback:** The system does not stream, download, or play video content.

---

## Further Notes

- **Empirical Gap Baseline:** Analysis of real Takeout exports confirmed a median inter-click gap of ~38 seconds, with 23% of gaps under 10 seconds. The UI framing acknowledges low completion probability as expected skipping/skimming rather than a bug.
- **Data Retention & Privacy:** Uploaded raw JSON files and SQLite records are stored locally on the user's host machine and can be purged upon request.
