# 05 — Unsupervised Semantic Goal Alignment & Recommendations

**What to build:**
Implement `GoalAlignmentEngine` and `RecommendationEngine` for automated goal scoring:
1. **Model:** Pretrained `sentence-transformers` model `all-MiniLM-L6-v2` generating 384-dimensional vector embeddings on local CPU.
2. **Text Payload Weighting:**
   - Channel Context (Title & Description): 40%
   - Topic Categories (`topicCategories` Wikipedia labels): 35%
   - Video Context (Title & Tags): 25%
3. **Similarity & Score:** Calculate cosine similarity between goal vector $\mathbf{v}_{\text{goal}}$ and video vector $\mathbf{v}_{\text{video}}$. Derive composite **Goal Alignment Probability Score (0–100%)**:
   $$\text{Score} = (0.50 \cdot \overline{S_{\text{aligned}}} + 0.30 \cdot FR - 0.10 \cdot \text{Penalty}_{SD} - 0.10 \cdot \text{Penalty}_{CS}) \times 100$$
4. **Channel Recommendations:** `RecommendationEngine` generates top-$k$ aligned channels to replace high-density, low-completion entertainment viewing.

Persist output in SQLite `goal_alignment_scores` table linked to `job_id`.

**Blocked by:** 04 — Behavioral Proxy Metrics Derivation Engine

**Status:** completed

- [x] `GoalAlignmentEngine.compute_text_embedding()` loads `all-MiniLM-L6-v2` and caches embeddings.
- [x] Weighted text payload combines Channel (40%), Topic Categories (35%), and Video (25%) text.
- [x] `GoalAlignmentEngine.calculate_cosine_similarity()` computes vector similarity scores.
- [x] `GoalAlignmentEngine.evaluate_alignment_score()` calculates composite 0-100% Alignment Probability Score.
- [x] `RecommendationEngine.generate_channel_recommendations()` produces top ranked goal-aligned channels.
- [x] Scores and channel recommendations saved in SQLite database.
- [x] Integration test verifies software engineering goal correctly aligns coding channels over entertainment channels.
