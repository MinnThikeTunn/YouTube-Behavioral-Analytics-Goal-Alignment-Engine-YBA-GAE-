import json
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from app.db.models import Job, RawRecord, RecordType, EnrichedVideo, EnrichedChannel, ComputedMetric, GoalAlignmentScore

logger = logging.getLogger(__name__)

# Global singleton model instance to prevent reloading weights
_EMBEDDING_MODEL: Optional[SentenceTransformer] = None

def get_embedding_model() -> SentenceTransformer:
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        logger.info("Loading sentence-transformers model 'all-MiniLM-L6-v2'...")
        _EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _EMBEDDING_MODEL

class GoalAlignmentEngine:
    SIMILARITY_THRESHOLD: float = 0.35  # Threshold for considering content aligned

    @classmethod
    def compute_text_embedding(cls, text: str) -> np.ndarray:
        model = get_embedding_model()
        if not text or not text.strip():
            return np.zeros((384,), dtype=np.float32)
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding

    @classmethod
    def compute_weighted_similarity(
        cls,
        goal_vector: np.ndarray,
        channel_text: str,
        topic_text: str,
        video_text: str
    ) -> float:
        """
        Computes weighted cosine similarity across 3 context layers:
        - Channel Context (Title & Description): 40%
        - Topic Categories (Wikipedia labels): 35%
        - Video Context (Title & Tags): 25%
        """
        if goal_vector is None or np.all(goal_vector == 0):
            return 0.0

        model = get_embedding_model()

        # Embed each context layer
        vec_channel = model.encode(channel_text, convert_to_numpy=True) if channel_text.strip() else None
        vec_topic = model.encode(topic_text, convert_to_numpy=True) if topic_text.strip() else None
        vec_video = model.encode(video_text, convert_to_numpy=True) if video_text.strip() else None

        sim_channel = float(cosine_similarity([goal_vector], [vec_channel])[0][0]) if vec_channel is not None else 0.0
        sim_topic = float(cosine_similarity([goal_vector], [vec_topic])[0][0]) if vec_topic is not None else 0.0
        sim_video = float(cosine_similarity([goal_vector], [vec_video])[0][0]) if vec_video is not None else 0.0

        # Apply weights: 0.40 Channel + 0.35 Topic + 0.25 Video
        weighted_sim = (0.40 * max(0.0, sim_channel)) + (0.35 * max(0.0, sim_topic)) + (0.25 * max(0.0, sim_video))
        return float(weighted_sim)

    @classmethod
    def evaluate_job_alignment(cls, db: Session, job_id: str, goal_text: str) -> Tuple[GoalAlignmentScore, List[Dict[str, Any]]]:
        """
        Evaluates semantic goal alignment for all watched videos in job_id.
        Computes composite Goal Alignment Probability Score (0-100%).
        """
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        video_records = db.query(RawRecord).filter(
            RawRecord.job_id == job_id,
            RawRecord.record_type == RecordType.VIDEO
        ).all()

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

        goal_vec = cls.compute_text_embedding(goal_text)

        # Collect video metadata
        video_ids = [r.video_id for r in video_records if r.video_id]
        enriched_videos = db.query(EnrichedVideo).filter(EnrichedVideo.video_id.in_(video_ids)).all()
        video_map = {v.video_id: v for v in enriched_videos}

        # Collect channel metadata
        channel_ids = [v.channel_id for v in enriched_videos if v.channel_id]
        enriched_channels = db.query(EnrichedChannel).filter(EnrichedChannel.channel_id.in_(channel_ids)).all()
        channel_map = {c.channel_id: c for c in enriched_channels}

        similarities: List[float] = []
        aligned_count = 0

        channel_scores: Dict[str, Dict[str, Any]] = {}

        for rec in video_records:
            v_orm = video_map.get(rec.video_id) if rec.video_id else None
            if not v_orm:
                # Fallback to raw title similarity if un-enriched
                sim = cls.compute_weighted_similarity(goal_vec, "", "", rec.raw_title)
                similarities.append(sim)
                if sim >= cls.SIMILARITY_THRESHOLD:
                    aligned_count += 1
                continue

            c_orm = channel_map.get(v_orm.channel_id) if v_orm.channel_id else None

            channel_text = f"{c_orm.channel_title or ''} {c_orm.channel_description or ''}" if c_orm else ""
            
            # Combine topic categories Wikipedia labels
            v_topics = " ".join(json.loads(v_orm.topic_categories_json or "[]"))
            c_topics = " ".join(json.loads(c_orm.topic_categories_json or "[]")) if c_orm else ""
            topic_text = f"{v_topics} {c_topics}".replace("https://en.wikipedia.org/wiki/", "").replace("_", " ")

            tags_str = " ".join(json.loads(v_orm.tags_json or "[]"))
            video_text = f"{v_orm.video_title or ''} {tags_str}"

            sim = cls.compute_weighted_similarity(goal_vec, channel_text, topic_text, video_text)
            similarities.append(sim)

            if sim >= cls.SIMILARITY_THRESHOLD:
                aligned_count += 1

            if c_orm:
                if c_orm.channel_id not in channel_scores:
                    channel_scores[c_orm.channel_id] = {
                        "channel_id": c_orm.channel_id,
                        "channel_title": c_orm.channel_title or "Unknown Channel",
                        "channel_description": c_orm.channel_description or "",
                        "similarities": []
                    }
                channel_scores[c_orm.channel_id]["similarities"].append(sim)

        avg_similarity = float(np.mean(similarities)) if similarities else 0.0
        focus_ratio = (aligned_count / float(len(video_records))) * 100.0

        # Fetch computed metrics
        metrics = db.query(ComputedMetric).filter(ComputedMetric.job_id == job_id).first()
        completion_prob = metrics.median_completion_prob if metrics else 0.5
        density = metrics.session_density if metrics else 0.0
        circadian = metrics.circadian_score if metrics else 0.0

        # Update ComputedMetric.focus_ratio with actual AI focus ratio
        if metrics:
            metrics.focus_ratio = focus_ratio
            db.commit()

        # Penalties calculation
        density_penalty = min(1.0, max(0.0, (density - 15.0) / 15.0))
        circadian_penalty = circadian / 100.0

        # Composite Goal Alignment Probability Score (0-100%)
        # Composite = (0.50 * Completion + 0.30 * (FocusRatio/100) - 0.10 * DensityPen - 0.10 * CircadianPen) * 100
        norm_focus = focus_ratio / 100.0
        raw_composite = (0.50 * avg_similarity) + (0.30 * norm_focus) - (0.10 * density_penalty) - (0.10 * circadian_penalty)
        final_score = max(0.0, min(100.0, raw_composite * 100.0))

        score_orm = db.query(GoalAlignmentScore).filter(GoalAlignmentScore.job_id == job_id).first()
        if not score_orm:
            score_orm = GoalAlignmentScore(job_id=job_id)

        score_orm.alignment_probability_score = round(final_score, 1)
        score_orm.focus_ratio_weight = 0.30
        score_orm.completion_weight = 0.50
        score_orm.session_density_penalty = round(density_penalty, 2)
        score_orm.circadian_penalty = round(circadian_penalty, 2)

        db.merge(score_orm)
        db.commit()

        # Generate top channel recommendations
        recommendations = []
        for c_id, data in channel_scores.items():
            mean_sim = float(np.mean(data["similarities"]))
            recommendations.append({
                "channel_id": c_id,
                "channel_title": data["channel_title"],
                "channel_description": data["channel_description"],
                "similarity_score": round(mean_sim, 2)
            })

        recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)
        return score_orm, recommendations[:5]

class RecommendationEngine:
    @classmethod
    def generate_channel_recommendations(cls, db: Session, job_id: str, goal_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        _, recommendations = GoalAlignmentEngine.evaluate_job_alignment(db, job_id, goal_text)
        return recommendations[:top_k]
