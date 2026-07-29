# Software Requirements Specification (SRS)

## YouTube Behavioral Analytics & Goal Alignment Predictor

**Version:** 1.0
**Date:** July 26, 2026
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for the **YouTube Behavioral Analytics & Goal Alignment Predictor**, a system that ingests a user's YouTube watch history (via Google Takeout), enriches it with metadata from the YouTube Data API v3, derives behavioral proxy metrics, and produces a goal-alignment assessment with actionable recommendations. This SRS is intended for developers, project reviewers/evaluators, and QA personnel involved in building and validating the system.

### 1.2 Scope

The system shall:

- Accept a user-uploaded `watch-history.json` (Google Takeout export).
- Asynchronously enrich watch history records with video/channel metadata via the YouTube Data API v3.
- Compute behavioral proxy metrics (Focus Ratio, Completion Probability, Session Density, Circadian Score) in the absence of true watch-duration data.
- Classify content relevance against a user-selected or user-defined goal using a channel/category-weighted supervised model.
- Present results through a web dashboard, including a Goal Alignment Probability Score and targeted channel recommendations.

The system shall **not**: modify the user's YouTube account or history, watch or stream video content itself, or guarantee ground-truth accuracy of "goal attainment" (see Section 2.5, Assumptions and Dependencies, and Section 4.6, Known Limitations).

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| SRS | Software Requirements Specification |
| API | Application Programming Interface |
| YDA v3 | YouTube Data API version 3 |
| NLP | Natural Language Processing |
| ML | Machine Learning |
| Takeout | Google's data export service, source of `watch-history.json` |
| Focus Ratio | Proportion of clicks/engagement classified as goal-aligned |
| Completion Probability | Proxy estimate of whether a video was watched to completion |
| Session Density | Rate of video clicks per hour within a viewing session |
| Circadian Score | Proportion of viewing activity occurring 11:00 PM–5:00 AM |
| Alignment Score | Model output (0–100%) estimating how well viewing habits support a stated goal |

### 1.4 References

- Google Takeout documentation (watch-history.json export format)
- YouTube Data API v3 Reference (`videos.list`, quota documentation)
- IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications (structural reference for this document)

### 1.5 Overview

Section 2 describes the product context, functions, users, and constraints. Section 3 details external interface requirements. Section 4 specifies functional requirements by module. Section 5 covers non-functional requirements. Section 6 lists data requirements, and Section 7 covers known limitations and open items for stakeholder sign-off.

---

## 2. Overall Description

### 2.1 Product Perspective

The system is a new, standalone web application composed of a FastAPI backend, a Celery/Redis asynchronous task queue, a scikit-learn-based classification model, and a Streamlit-based dashboard frontend. It depends on external Google infrastructure (Takeout export, YouTube Data API v3) but does not integrate directly with a user's live YouTube account (no OAuth-based read/write access is assumed in this version; ingestion is via manually uploaded Takeout files).

### 2.2 Product Functions (Summary)

1. Ingest and validate uploaded Takeout JSON files.
2. Enrich video records with category, channel, and duration metadata via batched API calls.
3. Compute behavioral proxy metrics per video and per session.
4. Accept and store a user-defined or user-selected goal profile.
5. Classify enriched, aggregated behavioral data against the goal profile to produce an Alignment Score.
6. Present metrics, score, and recommendations via a dashboard.
7. Generate targeted channel recommendations based on the identified goal gap.

### 2.3 User Characteristics

- **Primary user:** an individual with a personal Google/YouTube account, no technical expertise assumed. Must be able to locate and upload a Takeout export file.
- **Secondary user (implicit):** a project evaluator/reviewer assessing system output for correctness and usability, in the case this is an academic or portfolio deliverable.

### 2.4 Constraints

- YouTube Data API v3 default quota: 10,000 units/day; `videos.list` batching (up to 50 IDs/call) must be used to stay within quota for multi-year histories.
- Google Takeout does not include watch duration or scroll/completion data; only click timestamps and video/channel identifiers are available.
- Some Takeout entries reference deleted, private, or otherwise inaccessible videos and cannot be enriched via the API.
- `watch-history.json` contains multiple non-video entry types beyond ads, verified against real export data: **Community Post views** (title prefix "Viewed," `titleUrl` containing `/post/` rather than `/watch?v=`, no video ID and not enrichable via `videos.list`), **"Used Shorts creation tools"** entries (no `titleUrl` at all), and **"Visited [external URL]"** entries (ad-network click-through redirects, `titleUrl` pointing off-YouTube). In one verified sample export (15,100 records), these categories totaled ~4.6% of records (2.8% community posts, 1.7% ads, ~0.1% other), confirming this is a routine, non-negligible occurrence that must be filtered before any downstream metric calculation, not an edge case.
- Community Post entries in particular are frequently logged in tight timestamp clusters (multiple posts sharing the identical millisecond timestamp), which will corrupt Completion Probability and Session Density calculations (Section 4.2) if not excluded prior to those computations, since the near-zero gaps they introduce do not reflect real video-to-video viewing behavior.
- The system depends on the continued availability and terms of service of the YouTube Data API v3.

### 2.5 Assumptions and Dependencies

- Users will upload a valid, unmodified Takeout export in the expected JSON schema.
- The classifier's training labels (goal-aligned vs. not) will be sourced through a defined labeling process (see Section 4.4.1); this SRS assumes that process is finalized prior to Module 3 implementation and does not itself define the labeling methodology.
- Proxy metrics (Completion Probability, Session Density) are approximations, not ground truth, and are documented as such in all user-facing output (see Section 7).

---

## 3. External Interface Requirements

### 3.1 User Interfaces

- **UI-1:** A file upload interface accepting `.json` files up to a configurable maximum size (default: 500 MB), with progress/status feedback (e.g., "Processing — this may take several minutes").
- **UI-2:** A goal-selection interface offering a predefined taxonomy (e.g., "Software Engineering," "Health & Fitness," "Data Science") plus a free-text/custom-keyword option.
- **UI-3:** A dashboard displaying: Focus Ratio, Completion Probability distribution, Session Density trend, Circadian Score, Goal Alignment Score, and a ranked list of recommended channels.
- **UI-4:** All proxy-derived metrics shall be visually labeled as *estimates* (e.g., via tooltip, footnote, or "~" prefix) to avoid implying ground-truth precision.

### 3.2 Software Interfaces

- **SI-1:** YouTube Data API v3 — `videos.list` (part=snippet,contentDetails,topicDetails) and `channels.list` (part=snippet,topicDetails) endpoints, each called in batches of up to 50 IDs, using an API key or OAuth client credential configured server-side. Each call costs 1 quota unit regardless of ID count (up to the 50-ID limit), against a default project quota of 10,000 units/day.
- **SI-2:** Redis — used as the Celery message broker and result backend.
- **SI-3:** Celery — background worker framework for asynchronous ingestion/enrichment jobs.
- **SI-4:** FastAPI — REST API layer exposing upload, status-polling, and results-retrieval endpoints.

### 3.3 Communications Interfaces

- **CI-1:** All client-server communication shall occur over HTTPS.
- **CI-2:** The upload endpoint shall return an immediate `202 Accepted` response with a job ID; the client shall poll a status endpoint (or receive a websocket/push update) for job completion.

---

## 4. Functional Requirements

### 4.1 Module 1 — Data Ingestion & Batched API Enrichment

| ID | Requirement |
|---|---|
| FR-1.1 | The system shall accept an uploaded `watch-history.json` file via a REST endpoint and return a `202 Accepted` response with a unique job identifier. |
| FR-1.2 | The system shall offload parsing and enrichment to a background worker via a Celery/Redis queue; the API request thread shall not block on enrichment. |
| FR-1.3 | The system shall parse ISO 8601 timestamps from the Takeout export into structured datetime objects. |
| FR-1.4 | The system shall classify every parsed record into exactly one of the following types before any enrichment or metric calculation, using `titleUrl` pattern and title-prefix text: (a) **Video** — `titleUrl` contains `watch?v=`; eligible for API enrichment and all Module 2/3 metrics; (b) **Community Post** — `titleUrl` contains `/post/` or title begins with "Viewed" and no video ID is present; excluded from enrichment and from all engagement metrics, retained only in raw activity counts; (c) **Ad** — no `titleUrl` present and title matches "Viewed Ads On YouTube Homepage" or a `details` field with `"name": "From Google Ads"` is present; excluded from all metrics; (d) **Non-viewing activity** — title begins with "Used" (e.g., "Used Shorts creation tools") or "Visited" (ad-network click-through redirects to external URLs); excluded from all metrics; (e) **Inaccessible video** — `titleUrl` contains `watch?v=` but the corresponding `videos.list` API lookup returns no result (deleted/private video); excluded from enrichment-dependent metrics, retained in raw counts. |
| FR-1.4.1 | Type classification (FR-1.4) shall run as the first processing step on the full raw record set, strictly before timestamp-gap-based calculations (Completion Probability, Session Density; see FR-2.2–FR-2.6). Only records classified as **Video** (type a) shall be included in those gap-based calculations; Community Post, Ad, and Non-viewing-activity records shall be removed from the timestamp sequence entirely (not merely scored as zero) before consecutive-gap computation, since their presence — particularly tightly time-clustered Community Post batches — has been shown to introduce artificial near-zero gaps unrelated to real video-viewing behavior. |
| FR-1.5 | The system shall batch video ID lookups into groups of up to 50 per `videos.list` API call, requesting `part=snippet,contentDetails,topicDetails` to obtain video title, description, tags, channelId, categoryId, duration, and topicCategories in a single call (1 quota unit per call regardless of the number of IDs, up to the 50-ID limit). |
| FR-1.5.1 | The system shall separately batch the distinct `channelId` values collected from FR-1.5 into groups of up to 50 per `channels.list` API call, requesting `part=snippet,topicDetails`, to obtain each channel's own title, description, and topicCategories (this is a required second endpoint call, since a video's `snippet` does not include its channel's description). |
| FR-1.6 | The system shall track cumulative daily API quota usage across both `videos.list` and `channels.list` calls and shall pause/queue further enrichment requests if usage approaches the 10,000-unit daily limit, resuming automatically once quota resets at midnight Pacific Time. |
| FR-1.7 | The system shall persist enriched records (video category ID, channel ID, channel description, duration, tags, topicCategories) associated with the job ID for downstream processing. |
| FR-1.8 | The system shall provide a status endpoint reporting job state (queued, processing, partially complete, complete, failed) and percentage progress. |

### 4.2 Module 2 — Behavioral Analytics Engine (Proxy Metrics)

| ID | Requirement |
|---|---|
| FR-2.1 | The system shall compute **Focus Ratio** as (goal-aligned clicks / total clicks) × 100 per user, per time window. |
| FR-2.2 | The system shall compute **Completion Probability** per video as min(1, (t[n+1] − t[n]) / D[n]), where t[n] is the click timestamp, D[n] is video duration, subject to FR-2.3 and FR-2.4. |
| FR-2.3 | The system shall define a configurable session-boundary threshold (default: 30 minutes); a gap between t[n] and t[n+1] exceeding this threshold shall terminate the session, and Completion Probability for the last video in a session shall be computed using D[n] alone (assume full duration as the denominator ceiling) rather than an undefined or artificially inflated value. |
| FR-2.3.1 | Short inter-click gaps (well under typical video durations) shall be treated as an expected, common case rather than a rare edge case: verified analysis of a real Takeout export (14,410 filtered video records) showed a median inter-click gap of ~38 seconds, with 23% of gaps under 10 seconds. The dashboard (FR-4.4) shall reflect that Completion Probability will legitimately floor near 0 for a substantial share of records, and shall label this as likely rapid skipping/skimming rather than presenting it as a data error. |
| FR-2.4 | The system shall exclude the final video of the dataset (no subsequent click exists) from Completion Probability calculations, or shall flag it as "unknown" rather than defaulting to a numeric value. |
| FR-2.5 | The system shall compute **Session Density** as (total clicks within a session) / (session duration in hours). |
| FR-2.6 | The session-density threshold used to flag high-density/rapid-switching behavior shall be a configurable parameter (default value to be empirically validated, not hardcoded as final), not a fixed constant presented as universally correct. |
| FR-2.7 | The system shall compute **Circadian Score** as the percentage of clicks with a local timestamp between 23:00 and 05:00, using the user's configured or detected timezone. |
| FR-2.8 | All proxy metrics shall be recomputed and available on a per-session, per-day, and per-goal-period (e.g., weekly) basis. |

### 4.3 Module 3 — Goal Alignment & Trajectory Model

This module shall be **fully automated end-to-end**: a user uploads a Takeout file and receives an Alignment Score with no manual labeling, expert review, or human-in-the-loop step at any point, consistent with the product's "upload and get insights" design goal.

| ID | Requirement |
|---|---|
| FR-3.1 | The system shall accept a user-specified goal from a predefined taxonomy or free-text custom input at time of upload or dashboard setup. |
| FR-3.2 | The system shall automatically derive a goal-relevance signal for each enriched video record using an **unsupervised, similarity-based method** (see FR-3.3), requiring no manually labeled training examples. |
| FR-3.3 | Goal relevance shall be computed by embedding (a) the user's stated goal text and (b) each video's channel title/description (from `channels.list`, per FR-1.5.1), the video's and channel's `topicCategories` (a small set of high-level, Wikipedia-URL-based category labels returned by `topicDetails`; see FR-3.3.1), and video title/tags, into the same vector space (e.g., a pretrained sentence-embedding model), then scoring relevance via cosine similarity. Channel-level and topicCategory-level signals shall be weighted more heavily than title text, per the Section 1 context-blindness fix. |
| FR-3.3.1 | The system shall use only the `topicCategories` field from `topicDetails` as the topic signal. The legacy `topicIds` and `relevantTopicIds` fields shall NOT be used, as they were tied to Google's discontinued Freebase service and return empty or negligible data for current videos/channels; `topicCategories` is coarse (a small fixed set of high-level categories, e.g., "Technology," "Lifestyle") and shall be treated as a supplementary signal, not a sole determinant of alignment. |
| FR-3.4 | The system shall convert per-video similarity scores into an aggregate **Goal Alignment Probability Score** (0–100%) per user, per goal, per time window, by combining (a) the similarity-weighted Focus Ratio, (b) Session Density, and (c) Completion Probability into a single deterministic scoring function (e.g., a weighted sum or rule-based composite), avoiding dependency on any supervised classifier that would require labeled outcome data. |
| FR-3.5 | The system shall log the embedding model version, similarity thresholds, and scoring-function weights used for each computed Alignment Score, to support reproducibility if the scoring function or embedding model is later updated. |
| FR-3.6 | The system shall present the Alignment Score with an explicit accuracy/confidence caveat rather than as an unqualified predictive claim (see Section 7): it reflects **content-similarity to the stated goal**, not verified skill acquisition or outcome attainment. |
| FR-3.7 | The system shall allow the similarity threshold that separates "aligned" from "not aligned" content to be centrally configurable, so it can be recalibrated without retraining or relabeling anything. |

### 4.4 Module 3.1 — Automated Relevance Scoring Details (Replaces Manual Labeling)

| ID | Requirement |
|---|---|
| FR-3.1.1 | The system shall maintain a static, pre-built mapping table from common goal taxonomy entries (e.g., "Software Engineering," "Health & Fitness," "Data Science") to representative seed keywords/topic IDs, to bootstrap embedding comparisons for predefined goals without any per-user manual input beyond goal selection. |
| FR-3.1.2 | For free-text custom goals, the system shall embed the user's raw text directly and compare it against video-side embeddings at inference time, with no separate training or labeling step required. |
| FR-3.1.3 | The system shall NOT claim to predict real-world "goal attainment" outcomes; since no outcome-labeled data exists or is collected, output shall be framed strictly as a "content-alignment estimate," not an outcome prediction. |
| FR-3.1.4 | The system shall periodically spot-check aggregate scoring behavior against a small internal set of manually reviewed examples **for QA/regression-testing purposes only** (e.g., confirming a known coding channel scores as aligned to a "Software Engineering" goal); this QA step is a testing safeguard, not a labeling dependency, and is not required for the system to function or produce output for any user. |

### 4.5 Module 4 — Dashboard & Recommendation Engine

| ID | Requirement |
|---|---|
| FR-4.1 | The system shall display all computed metrics (Section 4.2) and the Goal Alignment Score (Section 4.3) on a single-page dashboard within [target: 3] seconds of job completion. |
| FR-4.2 | The system shall generate a ranked list of recommended channels aligned with the user's stated goal, using content-based filtering on category/channel similarity to already-aligned viewing. |
| FR-4.3 | The system shall generate at least one plain-language behavioral insight per session (e.g., "X% of your entertainment viewing occurred during your typical high-density hours") derived from computed metrics. |
| FR-4.4 | The dashboard shall visually distinguish estimated/proxy metrics from directly observed data (e.g., click counts and timestamps are observed; Completion Probability is estimated). |

### 4.6 Known Limitations (Non-Requirements, Documented for Stakeholder Awareness)

- Completion Probability is a session-gap-based proxy and cannot detect playback speed, scrubbing, or muted/background playback; it approximates engagement, not verified completion.
- Category ID granularity in the YouTube taxonomy is coarse and may misclassify content spanning multiple categories (e.g., "Education" vs. "Science & Technology" vs. "Howto & Style").
- The system cannot access Takeout records for videos removed from YouTube entirely (no ID resolvable via API); these are excluded from enrichment-based metrics, which introduces some data loss for older histories.

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **NFR-1:** The system shall process a Takeout file of up to 50,000 watch records within 15 minutes of background processing time, under normal API quota availability.
- **NFR-2:** The upload endpoint shall respond with `202 Accepted` within 2 seconds of receiving a file, regardless of file size (up to the configured maximum).

### 5.2 Scalability

- **NFR-3:** The architecture (FastAPI + Celery + Redis, containerized) shall support horizontal scaling of worker processes to handle concurrent user jobs without requiring architectural changes.

### 5.3 Reliability & Fault Tolerance

- **NFR-4:** If an enrichment job is interrupted (e.g., due to quota exhaustion or worker crash), the system shall resume from the last successfully processed batch rather than restarting from the beginning.
- **NFR-5:** Partial results (from videos successfully enriched before a failure) shall remain available to the user rather than being discarded.

### 5.4 Security & Privacy

- **NFR-6:** All uploaded watch-history data shall be encrypted at rest and in transit (HTTPS/TLS).
- **NFR-7:** The system shall define and enforce a data retention policy (e.g., automatic deletion of raw uploaded files and derived data after a configurable period, default 30 days) and shall provide users a mechanism to request immediate deletion of their data.
- **NFR-8:** The system shall not share or expose individual user watch history or derived behavioral scores to any third party.
- **NFR-9:** Access to any stored user data by system administrators shall be logged and access-controlled.

### 5.5 Usability

- **NFR-10:** Dashboard insights (FR-4.3) shall avoid moralizing or judgmental language; behavioral flags shall be presented as neutral observations, not value judgments about the user's habits.

### 5.6 Maintainability

- **NFR-11:** Proxy metric thresholds (session-boundary gap, session-density flag threshold, circadian window) shall be externally configurable (e.g., via config file or admin setting), not hardcoded, to allow empirical recalibration.

---

## 6. Data Requirements

- **DR-1:** Raw Takeout JSON, enriched video metadata, computed metrics, and model outputs shall be stored in a structured schema keyed by job ID and user ID.
- **DR-2:** Each stored metric record shall retain a reference to the metric version/formula used to compute it, to support future recalibration without breaking historical comparability.
- **DR-3:** Model training datasets (Section 4.4) shall be version-controlled separately from user data.

---

## 7. Open Items for Stakeholder Sign-Off

| ID | Item | Status |
|---|---|---|
| OI-1 | Select and finalize the embedding model to use for goal/video similarity scoring (FR-3.3) — no labeling required, but the model choice affects accuracy and shall be documented | Open |
| OI-2 | Determine default Session Density threshold empirically rather than assuming 20 clicks/hr | Open |
| OI-3 | Confirm data retention period and deletion mechanism (NFR-7) with legal/privacy stakeholders, if applicable | Open |
| OI-4 | Decide whether OAuth-based live YouTube account access is in scope for a future version (currently out of scope; Takeout upload only) | Open |
| OI-5 | Determine the similarity-score cutoff/threshold that separates "aligned" from "not aligned" content (FR-3.7), and whether it should vary by goal category | Open |

---

*End of Document*
