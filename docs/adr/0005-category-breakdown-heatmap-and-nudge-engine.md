# 5. Content Categorization, Hourly Heatmap, and Hybrid Behavioral Nudge Engine Architecture

* **Status:** Accepted
* **Date:** 2026-08-02

## Context and Problem Statement
The application needs to provide high-level behavioral insights to the user:
1. Categorizing viewing history into canonical topics (*Gaming*, *Entertainment*, *Sports*, *Software & Technology*, *Music*, *News*, *Education/Tutorials*, *Other*).
2. Displaying a 24-hour Time-of-Day Goal Alignment Heatmap showing peak focus versus low-alignment hours.
3. Delivering actionable Behavioral Interventions (Switching Threshold Alerts, Focus Goal Goalposts with swap calculations, and Late-Night Viewing alerts).

## Decision Drivers
- **Offline / Quota-Resilient Classification**: 100% of watch history entries must be categorized even when YouTube API metadata is missing or quota is paused.
- **Deterministic Actionable Math**: Goalpost nudges must compute precise counts of non-aligned videos to swap with goal content.
- **Enhanced Personalized Synthesis**: LLM capabilities should enhance nudge text when Gemini API is available, without breaking offline mode.
- **Design System Alignment**: Visual presentation must seamlessly integrate into the high-end Perplexity minimalist design system (`rounded-[32px]` containers, 2-column layout).

## Decision Outcome
Chosen Options:
1. **Hybrid Category Classification**: Use YouTube API `categoryId` and `topicCategories` mapped to canonical domains when available, falling back to title vector similarity matching (`sentence-transformers`) for un-enriched videos.
2. **Hourly Goal Alignment Score**: Compute average semantic cosine similarity per 1-hour local time bin ($h \in [0..23]$) along with total hourly click volume.
3. **Hybrid Behavioral Nudge Engine**: Calculate deterministic threshold alerts and swap mathematics on proxy metrics (`session_density`, `circadian_score`, `focus_ratio`), optionally synthesizing personalized natural language phrasing via Gemini API when available.
4. **Integrated Responsive Dashboard Layout**: Render heatmap and categorization charts side-by-side in `rounded-[32px]` cards, followed by behavioral intervention cards.
