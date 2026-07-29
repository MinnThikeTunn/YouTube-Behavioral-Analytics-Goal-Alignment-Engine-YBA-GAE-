# 04 — Behavioral Proxy Metrics Derivation Engine

**What to build:**
Implement `ProxyMetricsEngine` to compute mathematical proxy metrics from filtered `VIDEO` timestamps and enriched metadata without raw watch-time data:
1. **Completion Probability ($P_n$):** Formula $\min(1.0, (t_{n+1} - t_n) / D_n)$.
   - *Session Boundary Cutoff:* Inter-click gap $(t_{n+1} - t_n) > 30\text{ minutes}$ terminates a session. Final video in a session evaluates $P_n$ using full duration $D_n$ as denominator ceiling.
   - *Median Inter-Click Gap:* Short gaps floor $P_n$ near $0.0$ (handled as expected skipping/skimming).
2. **Focus Ratio ($FR$):** Percentage of goal-aligned clicks vs total video clicks.
3. **Session Density ($SD$):** Total clicks divided by session duration in hours. Flags density $>15 \text{ clicks/hour}$.
4. **Circadian Score ($CS$):** Percentage of clicks occurring between 11:00 PM and 5:00 AM local time.

Metrics stored in SQLite `computed_metrics` table linked to `job_id`.

**Blocked by:** 03 — Batched YouTube API Metadata Enrichment & Quota Manager

**Status:** completed

- [x] `ProxyMetricsEngine.calculate_completion_probability()` implements 30-minute session boundary rule.
- [x] Final video in session and dataset correctly evaluated without artificial zero/infinity errors.
- [x] `ProxyMetricsEngine.calculate_focus_ratio()` calculates percentage of aligned video clicks.
- [x] `ProxyMetricsEngine.calculate_session_density()` flags sessions exceeding 15 clicks/hour.
- [x] `ProxyMetricsEngine.calculate_circadian_score()` computes 11PM-5AM late-night percentage.
- [x] Results persisted in `ComputedMetric` SQLAlchemy ORM schema.
- [x] Unit tests pass for session boundary cutoffs and short inter-click gaps.
