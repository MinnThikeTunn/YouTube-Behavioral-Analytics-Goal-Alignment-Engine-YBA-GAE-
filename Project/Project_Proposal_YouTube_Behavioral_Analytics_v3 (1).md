# Project Proposal: AI-Driven YouTube Behavioral Analytics & Goal Alignment Predictor

**Version 3.0 — Automated, Labeling-Free Alignment Scoring**

---

## Executive Summary

Modern media consumption heavily influences personal productivity and long-term career trajectory. This project proposes the **YouTube Behavioral Analytics & Goal Alignment Predictor** — a fully automated, self-serve system: a user uploads their Google Takeout watch history and immediately receives behavioral insights and a goal-alignment score, with no manual labeling, training data curation, or human review required at any point.

By ingesting Google Takeout data asynchronously, enriching it via batched YouTube Data API v3 requests, and scoring alignment through automated embedding-similarity rather than a supervised classifier, the system evaluates user media habits against self-stated goals and bypasses the limitations of missing watch-duration data using click-density and completion-probability proxies.

---

## 1. Problem Statement

1. **Passive Media Consumption:** Individuals frequently spend hundreds of hours consuming online video without visibility into its opportunity cost on their professional goals.
2. **The "Watch Time" Data Void:** Exported user data (`watch-history.json`) only records the exact timestamp of a video click, not the duration watched. Systems relying on total video length grossly overestimate user engagement.
3. **API Quota and Scale Limitations:** Processing multi-year watch histories synchronously exhausts standard API quotas and crashes web servers, making naive implementations unscalable.
4. **Context Blindness:** Basic NLP models misclassify content based on ambiguous keywords (e.g., confusing "Python" the programming language with the snake), leading to wildly inaccurate productivity scoring.
5. **Mixed Content Types in the Raw Export:** `watch-history.json` is not exclusively video-watch events. Analysis of a real export (15,100 records) confirmed it also contains **Community Post views** (~2.8% of records, `titleUrl` pattern `/post/` instead of `/watch?v=`, no video ID and not enrichable via the API), ad impressions (~1.7%), and minor non-viewing entries ("Used Shorts creation tools," ad-redirect "Visited" entries). Left unfiltered, these entries — especially tightly time-clustered Community Post batches — introduce artificial near-zero timestamp gaps that corrupt gap-based engagement metrics.
6. **Training Data Bottleneck:** Supervised alignment classifiers require labeled ground truth (which videos are "aligned" with which goals), which either demands manual/expert labeling — breaking the "upload and instantly get insights" experience — or requires a slow, ongoing curation process. A self-serve product cannot depend on this.

---

## 2. Project Objectives

* **Asynchronous Data Ingestion:** Implement a decoupled backend architecture that handles massive JSON uploads without frontend browser timeouts.
* **Batched API Enrichment:** Utilize 50-ID API batching across both `videos.list` and `channels.list` to enrich raw click data with categories, durations, topic labels, and channel context, while strictly adhering to the 10,000-unit daily quota.
* **Formulate Proxy Metrics:** Calculate mathematical proxy metrics for engagement — Session Density and Completion Probability — to measure behavior without exact watch-time data.
* **Fully Automated Goal Alignment:** Score each user's viewing habits against their stated goal using unsupervised embedding similarity, requiring zero manual labeling and producing results the moment a file is uploaded.

---

## 3. System Architecture & Core Modules

```text
[ Google Takeout JSON ]
          │
          ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│ FastAPI Upload Endpoint   │ ──► │ Redis / Celery Async Queue│
└───────────────────────────┘     └─────────┬─────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Data Ingestion & Batched API Enrichment Module           │
│    (videos.list + channels.list)                            │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Behavioral Analytics Engine (Proxy Metrics)              │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Automated Goal Alignment Engine (Embedding Similarity)   │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. UX-Optimized Dashboard & Recommendation Engine           │
└─────────────────────────────────────────────────────────────┘

```

### Module 1: Ingestion & Batched Enrichment

* **Entry-Type Classification (runs first, before any enrichment or metric calculation):** Every parsed record is classified as one of: **Video** (`titleUrl` contains `watch?v=` — the only type sent to the API and included in engagement metrics), **Community Post** (`titleUrl` contains `/post/`, title begins "Viewed" — excluded, no video ID exists to enrich), **Ad** (no `titleUrl`, title "Viewed Ads On YouTube Homepage" or a `details: "From Google Ads"` field), or **Non-viewing activity** ("Used Shorts creation tools," ad-redirect "Visited..." entries). Only Video-type records proceed to enrichment and to the gap-based metrics in Module 2 — Community Posts, Ads, and non-viewing entries are removed from the timestamp sequence entirely, since they were confirmed (via real export analysis) to cluster at identical timestamps and would otherwise inject false near-zero gaps between real videos.
* **Decoupled Upload:** Users upload the JSON payload to a FastAPI backend, which immediately returns a `202 Accepted` response and offloads processing to a background worker (Celery).
* **Smart Batching, Two Endpoints:**
  - `videos.list` (`part=snippet,contentDetails,topicDetails`) is called in batches of up to 50 video IDs to retrieve title, description, tags, channelId, categoryId, duration, and `topicCategories`.
  - `channels.list` (`part=snippet,topicDetails`) is called in batches of up to 50 **distinct channel IDs** collected from the video results, to retrieve each channel's own title, description, and `topicCategories` — a video's own metadata does not include its channel's description, so this second batched call is required.
  - Each call, to either endpoint, costs exactly **1 quota unit regardless of batch size (up to 50 IDs)**, against the default 10,000-unit/day project quota — so batching effectively multiplies quota efficiency up to 50x versus per-ID calls.
* **Legacy field avoidance:** The system uses only the `topicCategories` field (a small, current set of high-level Wikipedia-URL-based category labels). The older `topicIds` / `relevantTopicIds` fields are not used, since they were tied to Google's now-discontinued Freebase service and return empty or negligible data on current videos/channels.

### Module 2: Behavioral Analytics Engine (Proxy Metrics)

Replaces flawed "Watch Time" tracking with mathematically derived proxy metrics:

| Metric | Calculation Method | Purpose |
| --- | --- | --- |
| **Focus Ratio** | $$\frac{\text{Clicks}_{\text{Aligned}}}{\text{Clicks}_{\text{Total}}} \times 100$$ | Measures productive interaction ratio based on click volume. |
| **Completion Probability** | $$P \approx \min\left(1, \frac{t_{n+1} - t_n}{D_n}\right)$$, with a configurable session-boundary cutoff (default 30 min) so large gaps and end-of-session videos don't produce misleading values | Estimates whether a video was likely finished, using the gap between clicks against video duration. |
| **Session Density** | $$\frac{\text{Total Clicks}}{\text{Session Duration (hrs)}}$$ | Flags rapid context-switching or short-form "doomscrolling"; threshold is configurable, not a fixed constant. |
| **Circadian Score** | Percentage of clicks occurring between 11:00 PM and 5:00 AM. | Evaluates potential impact on sleep hygiene. |

**Empirically validated against a real export:** after removing Community Posts, Ads, and non-viewing entries (Module 1), a real 14,410-record video history showed a median inter-click gap of ~38 seconds, with 23% of gaps under 10 seconds. This confirms Completion Probability will legitimately floor near 0 for a large share of records — expected, likely-skipping behavior, not a bug — and reinforces why the session-boundary cutoff must be a core part of the calculation rather than a rarely-hit edge case.

### Module 3: Automated Goal Alignment Engine

This module requires **no manual labeling, no curated training dataset, and no human-in-the-loop step**, so that alignment scoring works immediately for any user and any goal.

* **Goal Input:** Users select a goal from a predefined taxonomy (e.g., "Software Engineering," "Health & Fitness," "Data Science") or enter free-text.
* **Embedding-Based Relevance:** The user's goal text and each video's enriched context — channel title/description, video title/tags, and `topicCategories` from both the video and its channel — are embedded into the same vector space using a pretrained sentence-embedding model. Relevance is scored via cosine similarity, with channel-level and topicCategory signals weighted more heavily than video title text (directly solving the "Python the language vs. the snake" ambiguity).
* **Predefined Goal Bootstrapping:** Predefined taxonomy entries are backed by a small, static seed table of representative keywords/topics per goal, built once and requiring no per-user or ongoing labeling.
* **Aggregate Scoring:** Per-video similarity scores combine with Focus Ratio, Session Density, and Completion Probability into a single deterministic **Goal Alignment Probability Score (0–100%)**, via a rule-based/weighted composite — not a trained classifier, so there is no dependency on labeled outcome data.
* **Honest Framing:** The score is presented as a *content-alignment estimate*, not a prediction of real-world skill acquisition or goal attainment, since no outcome-labeled data exists or is collected.

### Module 4: Dashboard & Intervention Engine

* **UX Evaluation Focus:** The frontend prioritizes clear, immediate feedback: *"Are my habits helping or hurting me?"*
* **Targeted Recommendations:** Suggests high-value, goal-aligned channels to replace high-density, low-completion entertainment habits.
* **Transparent Metrics:** Proxy/estimated metrics (Completion Probability, Alignment Score) are visually distinguished from directly observed data (click counts, timestamps).

---

## 4. Technology Stack

* **Backend & API Routing:** FastAPI, Python 3.10+
* **Asynchronous Task Queue:** Celery, Redis
* **Containerization:** Docker (API, worker, and Redis services)
* **Data Processing & API Integration:** `pandas`, `google-api-python-client` (YouTube Data API v3 — `videos.list`, `channels.list`)
* **Goal Alignment:** Pretrained sentence-embedding model (e.g., a `sentence-transformers` model) + cosine similarity — no training pipeline, no labeled dataset, no classifier
* **Frontend Data Visualization:** Streamlit

---

## 5. Expected Outcomes & Deliverables

1. **Fault-Tolerant Pipeline:** A containerized backend that processes Takeout files asynchronously without dropping requests or exhausting API quota, using verified batching across `videos.list` and `channels.list`.
2. **Accurate Behavioral Proxies:** A data layer estimating engagement via click-gap and density calculations, with documented edge-case handling for session boundaries.
3. **Fully Automated Alignment Engine:** A goal-alignment scoring system that works immediately upon upload for any user or goal, with no labeling or training dependency, using channel/topic-weighted embedding similarity to resolve keyword ambiguity.
4. **Actionable Web Interface:** A dashboard translating viewing data into clearly-labeled estimates, habit interventions, and curated channel recommendations.

---

## 6. Notes on Scope & Honesty of Claims

* The Goal Alignment Score reflects **content similarity to a stated goal**, not verified learning or outcome attainment — this framing is carried through to all user-facing copy.
* Session Density and Circadian Score thresholds are configurable parameters, not fixed, empirically-unvalidated constants.
* Data privacy: uploaded watch history and derived scores are stored encrypted, subject to a defined retention/deletion policy, and never shared with third parties (see accompanying SRS for full requirements).
