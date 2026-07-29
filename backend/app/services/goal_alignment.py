import json
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer

from app.db.models import Job, RawRecord, RecordType, EnrichedVideo, EnrichedChannel, ComputedMetric, GoalAlignmentScore

logger = logging.getLogger(__name__)

_EMBEDDING_MODEL: Optional[SentenceTransformer] = None

def get_embedding_model() -> SentenceTransformer:
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        logger.info("Loading sentence-transformers model 'all-MiniLM-L6-v2'...")
        _EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _EMBEDDING_MODEL

class GoalAlignmentEngine:
    SIMILARITY_THRESHOLD: float = 0.20  # 0.20 threshold captures software & technical titles

    @classmethod
    def clean_title(cls, raw_title: str) -> str:
        """Strips leading 'Watched ' prefix and URLs from Takeout titles."""
        t = raw_title.strip()
        if t.startswith("Watched "):
            t = t[8:].strip()
        if t.startswith("http"):
            return ""
        return t

    @classmethod
    def compute_text_embedding(cls, text: str) -> np.ndarray:
        model = get_embedding_model()
        if not text or not text.strip():
            return np.zeros((384,), dtype=np.float32)
        return model.encode(text, convert_to_numpy=True)

    @classmethod
    def _compute_text_similarities(cls, model: SentenceTransformer, goal_vec: np.ndarray, text_list: List[str]) -> Dict[str, float]:
        """
        Deduplicates all unique titles across the history and computes cosine similarities
        via a single NumPy matrix dot product.
        """
        unique_texts = list(set([t for t in text_list if t and t.strip()]))
        if not unique_texts:
            return {}

        embeddings = model.encode(unique_texts, batch_size=512, convert_to_numpy=True, show_progress_bar=False)
        
        norm_goal = goal_vec / (np.linalg.norm(goal_vec) + 1e-9)
        norms_emb = np.linalg.norm(embeddings, axis=1, keepdims=True) + 1e-9
        norm_embeddings = embeddings / norms_emb

        sims = np.dot(norm_goal, norm_embeddings.T).flatten()
        return {text: float(sims[idx]) for idx, text in enumerate(unique_texts)}

    @classmethod
    def evaluate_job_alignment(cls, db: Session, job_id: str, goal_text: str) -> Tuple[GoalAlignmentScore, List[Dict[str, Any]]]:
        """
        Evaluates semantic goal alignment using BATCHED & DEDUPLICATED vector embeddings
        and NumPy matrix operations across ALL isolated video records.
        """
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        video_records = db.query(RawRecord).filter(
            RawRecord.job_id == job_id,
            RawRecord.record_type == RecordType.VIDEO
        ).order_by(RawRecord.timestamp.desc()).all()

        if not video_records:
            score_orm = GoalAlignmentScore(
                job_id=job_id,
                alignment_probability_score=0.0,
                focus_ratio_weight=0.30,
                completion_weight=0.50,
                session_density_penalty=0.10,
                circadian_penalty=0.10
            )
            db.merge(score_orm)
            db.commit()
            return score_orm, []

        model = get_embedding_model()
        goal_vec = model.encode(goal_text, convert_to_numpy=True)

        enriched_videos = db.query(EnrichedVideo).all()
        video_map = {v.video_id: v for v in enriched_videos}

        enriched_channels = db.query(EnrichedChannel).all()
        channel_map = {c.channel_id: c for c in enriched_channels}

        # Clean titles (strip 'Watched ')
        video_payloads: List[str] = [cls.clean_title(rec.raw_title) for rec in video_records]
        channel_payloads: List[str] = []
        topic_payloads: List[str] = []

        if video_map:
            for rec in video_records:
                v_orm = video_map.get(rec.video_id) if rec.video_id else None
                c_orm = channel_map.get(v_orm.channel_id) if (v_orm and v_orm.channel_id) else None

                ch_text = f"{c_orm.channel_title or ''} {c_orm.channel_description or ''}".strip() if c_orm else ""
                v_topics = " ".join(json.loads(v_orm.topic_categories_json or "[]")) if v_orm else ""
                c_topics = " ".join(json.loads(c_orm.topic_categories_json or "[]")) if c_orm else ""
                top_text = f"{v_topics} {c_topics}".replace("https://en.wikipedia.org/wiki/", "").replace("_", " ").strip()

                channel_payloads.append(ch_text)
                topic_payloads.append(top_text)

        # Rapid NumPy Matrix Similarity Lookups
        video_sim_map = cls._compute_text_similarities(model, goal_vec, video_payloads)
        channel_sim_map = cls._compute_text_similarities(model, goal_vec, channel_payloads) if channel_payloads else {}
        topic_sim_map = cls._compute_text_similarities(model, goal_vec, topic_payloads) if topic_payloads else {}

        similarities: List[float] = []
        aligned_count = 0

        for i, vd_t in enumerate(video_payloads):
            sim_vd = video_sim_map.get(vd_t, 0.0)
            sim_ch = channel_sim_map.get(channel_payloads[i], 0.0) if channel_payloads else 0.0
            sim_tp = topic_sim_map.get(topic_payloads[i], 0.0) if topic_payloads else 0.0

            sim = max(0.0, sim_vd)
            if channel_payloads and (channel_payloads[i] or topic_payloads[i]):
                sim = (0.40 * max(0.0, sim_ch)) + (0.35 * max(0.0, sim_tp)) + (0.25 * max(0.0, sim_vd))

            similarities.append(sim)
            if sim >= cls.SIMILARITY_THRESHOLD:
                aligned_count += 1

        top_sims = [s for s in similarities if s > 0.0]
        avg_top_sim = float(np.mean(top_sims)) if top_sims else 0.0
        focus_ratio = (aligned_count / float(len(video_records))) * 100.0

        metrics = db.query(ComputedMetric).filter(ComputedMetric.job_id == job_id).first()
        density = metrics.session_density if metrics else 0.0
        circadian = metrics.circadian_score if metrics else 0.0

        if metrics:
            metrics.focus_ratio = round(focus_ratio, 1)
            db.commit()

        density_penalty = min(1.0, max(0.0, (density - 15.0) / 15.0))
        circadian_penalty = circadian / 100.0

        # Scaled Goal Alignment Score (0-100%)
        scaled_sim_score = min(1.0, avg_top_sim / 0.35)
        raw_composite = (0.60 * scaled_sim_score) + (0.40 * (focus_ratio / 100.0)) - (0.10 * density_penalty) - (0.05 * circadian_penalty)
        final_score = max(5.0, min(100.0, raw_composite * 100.0))

        score_orm = db.query(GoalAlignmentScore).filter(GoalAlignmentScore.job_id == job_id).first()
        if not score_orm:
            score_orm = GoalAlignmentScore(job_id=job_id)

        score_orm.alignment_probability_score = round(final_score, 1)
        score_orm.focus_ratio_weight = 0.40
        score_orm.completion_weight = 0.60
        score_orm.session_density_penalty = round(density_penalty, 2)
        score_orm.circadian_penalty = round(circadian_penalty, 2)

        db.merge(score_orm)
        db.commit()

        recommendations = []
        for c_id, c_orm in channel_map.items():
            recommendations.append({
                "channel_id": c_id,
                "channel_title": c_orm.channel_title or "Unknown Channel",
                "channel_description": c_orm.channel_description or "",
                "similarity_score": 0.5
            })

        return score_orm, recommendations[:5]

class RecommendationEngine:
    @classmethod
    def generate_channel_recommendations(cls, db: Session, job_id: str, goal_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        _, recommendations = GoalAlignmentEngine.evaluate_job_alignment(db, job_id, goal_text)
        return recommendations[:top_k]
