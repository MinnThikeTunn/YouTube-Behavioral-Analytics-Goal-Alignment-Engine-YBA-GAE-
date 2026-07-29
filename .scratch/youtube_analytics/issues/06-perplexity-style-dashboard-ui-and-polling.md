# 06 — Perplexity-Style Interactive Dashboard UI & Status Polling

**What to build:**
Implement the complete frontend UI dashboard matching the **Perplexity Design Aesthetic** and API endpoints:
1. **API Endpoints:**
   - `GET /api/v1/jobs/{job_id}/status`: returns `JobStatusResponseDTO(job_id, status, progress_pct, total_records, video_records)`.
   - `GET /api/v1/analytics/{job_id}`: returns `AnalyticsResultDTO(metrics, alignment_score, recommendations)`.
2. **Dashboard UI:**
   - `rounded-[32px]` container cards with soft dark/light borders.
   - Headings styled with `font-black` typography and generous whitespace.
   - Ambient Dark / Light Mode contrast toggle.
   - Visual data transparency badges (`[Directly Observed]` vs `[Derived Estimate]`).
   - Interactive Recharts 24-hour circadian distribution area chart and metric breakdown cards.
   - Ranked channel replacement recommendation list.
   - Real-time polling hook (`ApiClient.pollStatus()`) updating progress bar until job state reaches `COMPLETED`.

**Blocked by:** 05 — Unsupervised Semantic Goal Alignment & Recommendations

**Status:** completed

- [x] `JobController.get_job_status()` and `AnalyticsController.get_analytics_results()` endpoints active.
- [x] Real-time status progress bar renders polling progress from `QUEUED` to `COMPLETED`.
- [x] Dashboard container components styled with `rounded-[32px]` and ambient borders.
- [x] Dark and Light mode theme toggle working smoothly across all UI elements.
- [x] `MetricBadge` renders clear `[Directly Observed]` and `[Derived Estimate]` badges on all cards.
- [x] Recharts 24-hour circadian area chart renders hourly distribution with smooth SVG gradients.
- [x] Channel replacement recommendation list renders top aligned channels.
- [x] End-to-end component test verifies full UI rendering from file upload to final analytics display.
