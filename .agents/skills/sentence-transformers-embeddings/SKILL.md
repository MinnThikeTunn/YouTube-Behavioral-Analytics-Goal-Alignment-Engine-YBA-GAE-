---
name: sentence-transformers-embeddings
description: Semantic vector embedding and unsupervised goal alignment scoring guidance using `sentence-transformers` (`all-MiniLM-L6-v2`). Use this skill whenever developing, tuning, or debugging sentence embeddings, vector cosine similarity calculations, goal alignment scoring, text concatenation rules for video/channel metadata, or CPU/GPU threading in FastAPI background tasks.
---

# Sentence Transformers Embeddings & Goal Alignment Engine

This skill provides comprehensive instructions for executing zero-label, unsupervised goal alignment scoring using local sentence embeddings (`sentence-transformers/all-MiniLM-L6-v2`) and vector cosine similarity.

## 1. Zero-Label Alignment Architecture

Traditional text classification requires supervised training datasets. This engine bypasses manual labeling entirely by calculating the **semantic distance** between a user's stated goal and enriched video context in a unified 384-dimensional vector space.

```
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│ User Goal Input                  │        │ Enriched Video & Channel Context │
│ "Software Engineering & Python"  │        │ (Title, Description, Topics)     │
└────────────────┬─────────────────┘        └────────────────┬─────────────────┘
                 │                                           │
                 ▼                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ SentenceTransformer("all-MiniLM-L6-v2") Embedding Model                      │
└────────────────┬───────────────────────────────────────────┬─────────────────┘
                 │                                           │
                 ▼ (Vector v_goal: [384,])                   ▼ (Vector v_video: [384,])
┌──────────────────────────────────────────────────────────────────────────────┐
│ Cosine Similarity Computation: cos_sim(v_goal, v_video)                      │
│ Score = (dot(v_goal, v_video) / (||v_goal|| * ||v_video||))                  │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Relevance Score S_relevance ∈ [0.0, 1.0]                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Context Formulation & Weighting Strategy

To resolve domain ambiguities (e.g. distinguishing "Python the programming language" from "Python the snake" or "Monty Python"), **DO NOT** embed the video title alone. Formulate a weighted, composite text representation:

### Metadata Concatenation Formula
```python
def build_composite_video_text(
    video_title: str,
    video_description: str,
    channel_title: str,
    channel_description: str,
    topic_categories: list[str]
) -> str:
    """
    Constructs a weighted context string.
    Channel title, description, and high-level topic categories are prioritized
    to establish strong domain context.
    """
    topics_str = ", ".join([t.split("/")[-1].replace("_", " ") for t in topic_categories])
    snippet_desc = video_description[:300] if video_description else ""
    snippet_channel_desc = channel_description[:300] if channel_description else ""

    composite = (
        f"Category Topics: {topics_str}. "
        f"Channel: {channel_title} - {snippet_channel_desc}. "
        f"Video Title: {video_title}. "
        f"Summary: {snippet_desc}"
    )
    return composite
```

---

## 3. Cosine Similarity & Composite Alignment Math

### Step A: Vector Cosine Similarity
```python
import numpy as np

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """Computes cosine similarity between two 1D vectors."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))
```

### Step B: Composite Goal Alignment Probability Score (0–100%)
Individual video relevance scores ($S_i$) are combined with derived behavioral metrics into a final deterministic aggregate score:

$$\text{Alignment Score} = \left( w_1 \cdot \bar{S}_{\text{relevance}} + w_2 \cdot \text{Focus Ratio} + w_3 \cdot \bar{P}_{\text{completion}} - w_4 \cdot \text{Penalty}_{\text{circadian}} \right) \times 100$$

* **Default Weights**:
  * $w_1 = 0.45$ (Mean Semantic Similarity of consumed videos)
  * $w_2 = 0.35$ (Focus Ratio: ratio of aligned clicks to total clicks)
  * $w_3 = 0.15$ (Median Completion Probability)
  * $w_4 = 0.05$ (Late-night circadian penalty)

---

## 4. Performance & Async Thread Offloading

Loading PyTorch and running `SentenceTransformer.encode()` is **CPU-bound** and synchronous. If executed directly inside FastAPI route handlers, it will freeze the event loop for all concurrent users.

### Execution Rule
Always run embedding operations in a background task queue worker or offload to a thread pool via `asyncio.to_thread`:

```python
import asyncio
from sentence_transformers import SentenceTransformer

# Singleton model instance
_model = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def encode_texts_sync(texts: list[str]) -> np.ndarray:
    model = get_model()
    return model.encode(texts, batch_size=32, show_progress_bar=False, convert_to_numpy=True)

async def encode_texts_async(texts: list[str]) -> np.ndarray:
    """Safely offloads embedding generation to worker thread."""
    return await asyncio.to_thread(encode_texts_sync, texts)
```
