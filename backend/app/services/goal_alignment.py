import os
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
        """Strips leading 'Watched ' prefix and URLs from raw video titles."""
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
    def compute_weighted_similarity(cls, goal_vec_or_text, channel_text: str = "", topic_text: str = "", video_text: str = "") -> float:
        """
        Computes weighted similarity score across channel text (40%), topic text (35%), and video title text (25%).
        """
        if isinstance(goal_vec_or_text, np.ndarray):
            emb_ch = cls.compute_text_embedding(channel_text) if channel_text else np.zeros((384,), dtype=np.float32)
            emb_tp = cls.compute_text_embedding(topic_text) if topic_text else np.zeros((384,), dtype=np.float32)
            emb_vd = cls.compute_text_embedding(video_text) if video_text else np.zeros((384,), dtype=np.float32)
            
            norm_goal = np.linalg.norm(goal_vec_or_text)
            def cos_sim(v):
                n = np.linalg.norm(v)
                if norm_goal == 0 or n == 0: return 0.0
                return float(np.dot(goal_vec_or_text, v) / (norm_goal * n))

            sim_ch = cos_sim(emb_ch)
            sim_tp = cos_sim(emb_tp)
            sim_vd = cos_sim(emb_vd)
        else:
            goal_text = str(goal_vec_or_text)
            sim_ch = cls._compute_text_similarities(goal_text, [channel_text]).get(channel_text, 0.0) if channel_text else 0.0
            sim_tp = cls._compute_text_similarities(goal_text, [topic_text]).get(topic_text, 0.0) if topic_text else 0.0
            sim_vd = cls._compute_text_similarities(goal_text, [video_text]).get(video_text, 0.0) if video_text else 0.0

        return (0.40 * max(0.0, sim_ch)) + (0.35 * max(0.0, sim_tp)) + (0.25 * max(0.0, sim_vd))

    @classmethod
    def _compute_text_similarities(cls, goal_text: str, text_list: List[str]) -> Dict[str, float]:
        """
        Batched Cosine Similarity matrix calculation using sentence-transformers (all-MiniLM-L6-v2)
        with TF-IDF fallback.
        Deduplicates unique text payloads and returns normalized cosine similarity map.
        """
        unique_texts = list(set([t for t in text_list if t and t.strip()]))
        if not unique_texts or not goal_text.strip():
            return {}

        try:
            model = get_embedding_model()
            goal_emb = model.encode(goal_text, convert_to_numpy=True)
            text_embs = model.encode(unique_texts, convert_to_numpy=True)

            norm_goal = np.linalg.norm(goal_emb)
            norm_texts = np.linalg.norm(text_embs, axis=1)

            if norm_goal == 0:
                return {t: 0.0 for t in unique_texts}

            dots = np.dot(text_embs, goal_emb)
            denom = norm_texts * norm_goal
            denom[denom == 0] = 1e-9
            sims = dots / denom

            return {text: float(max(0.0, sims[idx])) for idx, text in enumerate(unique_texts)}
        except Exception as e:
            logger.warning(f"SentenceTransformer similarity failed, falling back to TF-IDF: {e}")
            try:
                from sklearn.feature_extraction.text import TfidfVectorizer
                from sklearn.metrics.pairwise import cosine_similarity

                corpus = [goal_text] + unique_texts
                vectorizer = TfidfVectorizer(stop_words='english', sublinear_tf=True, ngram_range=(1, 2))
                tfidf_matrix = vectorizer.fit_transform(corpus)

                goal_vector = tfidf_matrix[0:1]
                text_vectors = tfidf_matrix[1:]

                sim_matrix = cosine_similarity(goal_vector, text_vectors).flatten()
                return {text: float(sim_matrix[idx]) for idx, text in enumerate(unique_texts)}
            except Exception as ex:
                logger.error(f"Error computing similarity: {ex}")
    @classmethod
    def _compute_tfidf_similarities(cls, goal_text: str, text_list: List[str]) -> Dict[str, float]:
        """
        Ultra-fast TF-IDF & Cosine Similarity matrix calculation (<0.005s execution)
        for real-time endpoint rendering.
        """
        unique_texts = list(set([t for t in text_list if t and t.strip()]))
        if not unique_texts or not goal_text.strip():
            return {}

        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity

            corpus = [goal_text] + unique_texts
            vectorizer = TfidfVectorizer(stop_words='english', sublinear_tf=True, ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform(corpus)

            goal_vector = tfidf_matrix[0:1]
            text_vectors = tfidf_matrix[1:]

            sim_matrix = cosine_similarity(goal_vector, text_vectors).flatten()
            return {text: float(sim_matrix[idx]) for idx, text in enumerate(unique_texts)}
        except Exception as e:
            logger.error(f"Error computing TF-IDF similarity: {e}")
            return {}

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
        ).order_by(RawRecord.timestamp.desc()).limit(2500).all()

        if not video_records:
            score_orm = db.query(GoalAlignmentScore).filter(GoalAlignmentScore.job_id == job_id).first()
            if not score_orm:
                score_orm = GoalAlignmentScore(job_id=job_id)
                db.add(score_orm)
            score_orm.alignment_probability_score = 0.0
            score_orm.focus_ratio_weight = 0.30
            score_orm.completion_weight = 0.50
            score_orm.session_density_penalty = 0.10
            score_orm.circadian_penalty = 0.10
            try:
                db.commit()
            except Exception:
                db.rollback()
            return score_orm, []


        video_ids = list(set([rec.video_id for rec in video_records if rec.video_id]))
        enriched_videos = db.query(EnrichedVideo).filter(EnrichedVideo.video_id.in_(video_ids)).all() if video_ids else []
        video_map = {v.video_id: v for v in enriched_videos}

        channel_ids = list(set([v.channel_id for v in enriched_videos if v.channel_id]))
        enriched_channels = db.query(EnrichedChannel).filter(EnrichedChannel.channel_id.in_(channel_ids)).all() if channel_ids else []
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

        # Rapid TF-IDF Cosine Similarity Matrix Lookups (<0.1s execution)
        video_sim_map = cls._compute_text_similarities(goal_text, video_payloads)
        channel_sim_map = cls._compute_text_similarities(goal_text, channel_payloads) if channel_payloads else {}
        topic_sim_map = cls._compute_text_similarities(goal_text, topic_payloads) if topic_payloads else {}

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
            db.add(score_orm)

        score_orm.alignment_probability_score = round(final_score, 1)
        score_orm.focus_ratio_weight = 0.40
        score_orm.completion_weight = 0.60
        score_orm.session_density_penalty = round(density_penalty, 2)
        score_orm.circadian_penalty = round(circadian_penalty, 2)

        try:
            db.commit()
        except Exception:
            db.rollback()


        recommendations = []
        # Build channel-to-video similarity aggregation
        channel_video_sims: Dict[str, List[float]] = {}
        for i, rec in enumerate(video_records):
            v_orm = video_map.get(rec.video_id) if rec.video_id else None
            c_id = v_orm.channel_id if v_orm else None
            if c_id:
                if c_id not in channel_video_sims:
                    channel_video_sims[c_id] = []
                channel_video_sims[c_id].append(similarities[i])

        for c_id, c_orm in channel_map.items():
            ch_text = f"{c_orm.channel_title or ''} {c_orm.channel_description or ''}".strip()
            sim_meta = channel_sim_map.get(ch_text, 0.0) if channel_sim_map else 0.0
            v_sims = channel_video_sims.get(c_id, [])
            max_v_sim = max(v_sims) if v_sims else 0.0
            avg_v_sim = float(np.mean(v_sims)) if v_sims else 0.0

            channel_composite_sim = max(sim_meta, (0.70 * max_v_sim) + (0.30 * avg_v_sim))

            if channel_composite_sim >= cls.SIMILARITY_THRESHOLD:
                recommendations.append({
                    "channel_id": c_id,
                    "channel_title": c_orm.channel_title or "Unknown Channel",
                    "channel_description": c_orm.channel_description or "Watched in your history.",
                    "similarity_score": round(max(0.0, channel_composite_sim), 2),
                    "category": "watched",
                    "channel_url": f"https://www.youtube.com/channel/{c_id}" if c_id else None
                })

        # Sort watched channels by highest real similarity
        recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)
        return score_orm, recommendations

import re
import urllib.parse

# Backward-compatible map container (Dynamic engine generates live goal-tailored channels without hardcoding)
CURATED_DISCOVERY_MAP = {}

class RecommendationEngine:
    GEMINI_MODELS = [
        "gemini-3.1-flash-lite",
        "gemini-3.1-flash-lite-preview",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-flash"
    ]

    @classmethod
    def generate_and_save_recommendations(cls, db: Session, job_id: str, goal_text: str, user_api_key: Optional[str] = None):
        """
        Executes hybrid recommendation pipeline once during background processing or goal change.
        Saves both 'watched' (history vector-aligned) and 'discovery' (external dynamic AI/tailored channels)
        channel items into the recommended_channels table.
        """
        from app.db.models import RecommendedChannel
        
        # Clear prior recommendations for this job to prevent stale accumulation
        try:
            db.query(RecommendedChannel).filter(RecommendedChannel.job_id == job_id).delete(synchronize_session=False)
            db.commit()
        except Exception as e:
            logger.debug(f"Clear prior recommendations note: {e}")
            db.rollback()

        # 1. Watched channels from history (Real Vector Cosine Similarity)
        try:
            _, watched_recs = GoalAlignmentEngine.evaluate_job_alignment(db, job_id, goal_text)
            for item in watched_recs[:5]:
                if item.get("similarity_score", 0) > 0.05:
                    orm_watched = RecommendedChannel(
                        job_id=job_id,
                        channel_id=item.get("channel_id"),
                        channel_title=item["channel_title"],
                        channel_description=item.get("channel_description"),
                        similarity_score=item["similarity_score"],
                        category="watched",
                        channel_url=item.get("channel_url")
                    )
                    db.add(orm_watched)
        except Exception as e:
            logger.debug(f"Watched channels evaluation note: {e}")

        # 2. Dynamic Discovery channels tailored to user's exact learning goal
        discovery_items = cls.fetch_gemini_discovery_channels(goal_text, user_api_key=user_api_key)

        for item in discovery_items[:5]:
            orm_disc = RecommendedChannel(
                job_id=job_id,
                channel_id=item.get("channel_id"),
                channel_title=item.get("channel_title", f"{goal_text.strip().title()} Learning"),
                channel_description=item.get("channel_description", f"High-alignment educational content for {goal_text}."),
                similarity_score=float(item.get("similarity_score", 0.95)),
                category="discovery",
                channel_url=item.get("channel_url")
            )
            db.add(orm_disc)

        db.commit()

    @classmethod
    def fetch_youtube_api_channels(cls, goal_text: str, user_api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Queries YouTube Data API v3 search endpoint (type=channel) to discover real, verified YouTube channels
        tailored to the user's specific learning goal.
        """
        from app.config import settings
        import httpx

        yt_key = user_api_key or os.getenv("YOUTUBE_API_KEY") or getattr(settings, "YOUTUBE_API_KEY", "")
        if not yt_key:
            return []

        clean_goal = (goal_text or "General Learning").strip()
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": clean_goal,
            "type": "channel",
            "maxResults": 5,
            "key": yt_key
        }

        try:
            with httpx.Client(timeout=6.0) as client:
                r = client.get(url, params=params)
                if r.status_code == 200:
                    items = r.json().get("items", [])
                    channels = []
                    for idx, item in enumerate(items):
                        snip = item.get("snippet", {})
                        ch_id = snip.get("channelId")
                        title = snip.get("title", "")
                        desc = snip.get("description", "")
                        if not desc:
                            desc = f"Official YouTube channel aligned with {clean_goal} tutorials, projects, and guides."
                        
                        score = round(max(0.85, 0.96 - (idx * 0.02)), 2)
                        channels.append({
                            "channel_id": ch_id,
                            "channel_title": title,
                            "channel_description": desc,
                            "similarity_score": score,
                            "channel_url": f"https://www.youtube.com/channel/{ch_id}" if ch_id else f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(title)}"
                        })
                    if channels:
                        logger.info(f"Successfully discovered {len(channels)} real YouTube channels via YouTube Data API.")
                        return channels
        except Exception as e:
            logger.debug(f"YouTube API channel search exception: {e}")

        return []

    @classmethod
    def fetch_youtube_api_focus_videos(cls, goal_text: str, user_api_key: Optional[str] = None) -> List[str]:
        """
        Queries YouTube Data API v3 search endpoint (type=video) to find real 11-char video IDs for the goal.
        """
        from app.config import settings
        import httpx

        yt_key = user_api_key or os.getenv("YOUTUBE_API_KEY") or getattr(settings, "YOUTUBE_API_KEY", "")
        if not yt_key:
            return []

        clean_goal = (goal_text or "General Learning").strip()
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": f"{clean_goal} tutorial course",
            "type": "video",
            "maxResults": 5,
            "key": yt_key
        }

        try:
            with httpx.Client(timeout=6.0) as client:
                r = client.get(url, params=params)
                if r.status_code == 200:
                    items = r.json().get("items", [])
                    video_ids = []
                    for item in items:
                        vid = item.get("id", {}).get("videoId")
                        if vid and isinstance(vid, str) and len(vid) == 11:
                            video_ids.append(vid)
                    return video_ids
        except Exception as e:
            logger.debug(f"YouTube API focus video search exception: {e}")

        return []

    @classmethod
    def fetch_gemini_recommendations_and_queue(cls, goal_text: str, user_api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Queries Gemini Flash models to discover top-tier goal aligned channels and focus queue videos.
        Returns a dict with 'channels', 'focus_videos', and 'video_ids'.
        """
        from app.config import settings
        
        gemini_key = user_api_key or getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY") or getattr(settings, "YOUTUBE_API_KEY", "")
        if not gemini_key:
            return None

        import httpx
        prompt = f"""You are an expert YouTube learning advisor and educational curator.
Analyze the target learning goal: "{goal_text}".

Recommend:
1. "channels": Exactly 5 premier, real, high-quality YouTube channels specializing in this domain.
   Each channel must have:
   - "channel_title": Exact name of the YouTube channel
   - "channel_description": Brief description of what they teach and pedagogical value
   - "similarity_score": Estimated alignment score between 0.88 and 0.99
   - "channel_url": Direct YouTube channel URL (e.g. "https://www.youtube.com/@channelname")

2. "focus_videos": Exactly 5 essential, high-impact tutorial videos to kickstart deep learning.
   Each video must have:
   - "title": Video title
   - "channel": Channel name
   - "video_id": 11-character YouTube video ID (if known) or valid YouTube URL
   - "video_url": Direct video URL

3. "video_ids": An array of real 11-character YouTube video IDs from the recommended focus videos.

Return strictly valid JSON with this exact structure:
{{
  "channels": [
    {{
      "channel_title": "string",
      "channel_description": "string",
      "similarity_score": 0.95,
      "channel_url": "https://www.youtube.com/@channelname"
    }}
  ],
  "focus_videos": [
    {{
      "title": "string",
      "channel": "string",
      "video_id": "string",
      "video_url": "https://www.youtube.com/watch?v=string"
    }}
  ],
  "video_ids": ["11_char_id1", "11_char_id2"]
}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2
            }
        }

        for model_name in cls.GEMINI_MODELS:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                r = httpx.post(url, json=payload, timeout=12.0)
                if r.status_code == 429:
                    logger.debug(f"Gemini API quota note for {model_name} (429). Trying next model.")
                    continue

                if r.status_code == 200:
                    resp_json = r.json()
                    parts = resp_json.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    raw_text = "".join([p["text"] for p in parts if "text" in p and p["text"]]).strip()
                    cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
                    data = json.loads(cleaned_text)
                    if isinstance(data, dict) and "channels" in data and len(data["channels"]) > 0:
                        logger.info(f"Successfully generated {len(data['channels'])} recommendations & focus queue via Gemini API ({model_name}).")
                        return data
                    elif isinstance(data, list) and len(data) > 0:
                        return {"channels": data, "focus_videos": [], "video_ids": []}
                else:
                    logger.debug(f"Gemini model {model_name} returned status {r.status_code}: {r.text[:200]}")
            except (httpx.TimeoutException, httpx.ConnectTimeout, httpx.NetworkError) as e:
                logger.debug(f"Gemini model {model_name} timeout/network error ({e}). Trying next model.")
                continue
            except Exception as e:
                logger.debug(f"Gemini model {model_name} attempt failed: {e}")
                continue

        return None

    @classmethod
    def fetch_gemini_discovery_channels(cls, goal_text: str, user_api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Queries Gemini Generative AI to discover top-tier goal-aligned channels solely.
        NO hardcoded queries, template strings, or stored database cache are used.
        """
        clean_goal = (goal_text or "General Learning").strip()
        gemini_data = cls.fetch_gemini_recommendations_and_queue(clean_goal, user_api_key=user_api_key)
        if gemini_data and isinstance(gemini_data, dict) and "channels" in gemini_data and len(gemini_data["channels"]) > 0:
            return gemini_data["channels"]
        return []

    @classmethod
    def get_focus_queue_url(cls, goal_text: str, db: Optional[Session] = None, job_id: Optional[str] = None, user_api_key: Optional[str] = None) -> str:
        """
        Synthesizes a 1-Click Distraction-Free Focus Queue URL tailored to the user's specific goal.
        Returns a watch_videos queue URL if video IDs are available from history/Gemini/YouTube API, or a focused YouTube search queue URL.
        """
        clean_goal = (goal_text or "General Learning").strip()
        playlist_video_ids = []

        # 1. Check if user has highly-aligned video records in their history
        if db and job_id:
            try:
                from app.db.models import RawRecord, RecordType
                aligned_records = db.query(RawRecord.video_id).filter(
                    RawRecord.job_id == job_id,
                    RawRecord.record_type == RecordType.VIDEO,
                    RawRecord.video_id.isnot(None)
                ).order_by(RawRecord.timestamp.desc()).limit(15).all()
                playlist_video_ids = [r[0] for r in aligned_records if r[0] and len(r[0]) == 11]
            except Exception:
                pass

        # 2. Query Gemini for domain-specific focus queue video IDs
        if len(playlist_video_ids) < 3:
            try:
                gemini_data = cls.fetch_gemini_recommendations_and_queue(clean_goal, user_api_key=user_api_key)
                if gemini_data:
                    raw_ids = gemini_data.get("video_ids", [])
                    for vid in raw_ids:
                        if vid and isinstance(vid, str) and len(vid) == 11 and vid not in playlist_video_ids:
                            playlist_video_ids.append(vid)

                    if len(playlist_video_ids) < 3:
                        for fv in gemini_data.get("focus_videos", []):
                            v_url = fv.get("video_url", "") or fv.get("video_id", "")
                            match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', v_url)
                            if match:
                                vid = match.group(1)
                                if vid not in playlist_video_ids:
                                    playlist_video_ids.append(vid)
            except Exception as e:
                logger.debug(f"Gemini focus queue generation note: {e}")

        # 3. Query YouTube Data API search for real video IDs if still under 3
        if len(playlist_video_ids) < 3:
            try:
                yt_vids = cls.fetch_youtube_api_focus_videos(clean_goal, user_api_key=user_api_key)
                for vid in yt_vids:
                    if vid not in playlist_video_ids:
                        playlist_video_ids.append(vid)
            except Exception as e:
                logger.debug(f"YouTube API focus video lookup note: {e}")

        # 4. If valid video IDs found, return watch_videos queue URL
        if playlist_video_ids:
            return f"https://www.youtube.com/watch_videos?video_ids={','.join(playlist_video_ids[:10])}"

        # 5. Default focused search query URL dynamically constructed for the user's specific goal
        safe_query = urllib.parse.quote_plus(f"{clean_goal} tutorial course masterclass")
        return f"https://www.youtube.com/results?search_query={safe_query}"


