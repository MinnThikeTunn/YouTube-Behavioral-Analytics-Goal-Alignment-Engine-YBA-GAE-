# 3. Use sentence-transformers (all-MiniLM-L6-v2) for Semantic Goal Alignment

* **Status:** Accepted
* **Date:** 2026-07-29

## Context and Problem Statement
The YouTube Behavioral Analytics system requires an unsupervised method to evaluate how well watched YouTube videos and channels match a user's stated goal (e.g., "Software Engineering" vs "Cookery") without manual labeling or outcome data.

## Decision Drivers
- Unsupervised execution (no manual data labeling required).
- Semantic awareness (e.g., understanding that "Python", "Data Structures", "FastAPI" match "Software Engineering").
- Fast CPU inference on local non-containerized developer machines.

## Considered Options
1. `sentence-transformers` pretrained model `all-MiniLM-L6-v2` (384-d embeddings).
2. Scikit-learn TF-IDF N-gram cosine similarity.

## Decision Outcome
Chosen Option: **1. sentence-transformers (all-MiniLM-L6-v2)**.

### Implementation Details
- Model: `sentence-transformers/all-MiniLM-L6-v2` (~80MB download, cached locally).
- Vector Dimensions: 384.
- Weighted Text Payload:
  - Channel context (title & description): 40%
  - Topic Categories (Wikipedia URL labels): 35%
  - Video context (title & tags): 25%
- Scoring: Cosine similarity between goal vector $\mathbf{v}_{\text{goal}}$ and video vector $\mathbf{v}_{\text{video}}$.
