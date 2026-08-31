import os
import html
import re
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import dateutil.parser
import httpx
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from app.db.models import MinedComment, CommentIntent
from app.schemas.creator import (
    MinedCommentDTO, IntentDistributionBreakdownDTO,
    TopicIntentHeatmapCellDTO, ChannelIntentDistributionDTO
)
from app.config import settings

logger = logging.getLogger(__name__)

def clean_comment_text(text: str) -> str:
    if not text:
        return ""
    # Strip HTML tags
    clean = re.sub(r'<br\s*/?>', ' ', text, flags=re.IGNORECASE)
    clean = re.sub(r'<[^>]+>', '', clean)
    # Unescape HTML entities (&amp;, &quot;, &#39;, etc.)
    clean = html.unescape(clean)
    # Normalize whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


class CommentMinerService:
    GEMINI_MODELS = [
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.7-flash"
    ]

    def __init__(self, db: Session, api_key: str = None):
        self.db = db
        self.api_key = api_key or os.environ.get("YOUTUBE_API_KEY") or settings.YOUTUBE_API_KEY
        self.youtube = build('youtube', 'v3', developerKey=self.api_key) if self.api_key else None

    # ── Rule-Based Fallback Multilingual Classification ──────────

    def classify_intent(self, text: str) -> CommentIntent:
        """Classifies comment intent across Burmese Unicode, Romanized Burmglish, and English."""
        if not text:
            return CommentIntent.PRAISE

        text_clean = clean_comment_text(text)
        text_lower = text_clean.lower()

        # 1. CONFUSION patterns (audio issues, errors, misunderstandings, unclear instructions)
        burmese_confusion = [
            "အသံမကြား", "မကြားရ", "နားမလည်", "မရှင်းဘူး", "မရှင်းပါ", "မရှင်း",
            "ဘာပြောတာလဲ", "ဘာလဲမသိ", "မသိဘူး", "မသိတော့", "အဆင်မပြေ",
            "error တက်", "error ဖြစ်", "မရဘူး", "မရတော့", "လိုင်းကျ",
            "မမြင်ရ", "နားမလည်တော့", "နားမလည်ဘူး"
        ]
        burmglish_confusion = re.search(
            r'(na ma lal|nar ma lal|a than ma kyar|ma shin|br pyr|ba pyaw|ma thi bu|ma ya bu|a sin ma pyay|error tak|error tet)',
            text_lower
        )
        english_confusion = re.search(
            r'(confus\w*|don\'t understand|do not understand|doesn\'t make sense|not making sense|cannot hear|can\'t hear|no sound|no audio|audio issue|error\w*|cause an error|broken|fail\w*|why does this|stuck|not working|doesn\'t work|what happened|unclear)',
            text_lower
        )

        if any(kw in text_clean for kw in burmese_confusion) or burmglish_confusion or english_confusion:
            return CommentIntent.CONFUSION

        # 2. DEBATE patterns (disagreements, incorrect, objections, critique)
        burmese_debate = [
            "မဟုတ်သေး", "မဟုတ်ဘူး", "မဟုတ်ပါ", "မှားနေ", "မှားတယ်", "မှားပါတယ်",
            "မကြိုက်ဘူး", "မကြိုက်ပါ", "မကြိုက်", "မတူဘူး", "မတူပါ", "လက်မခံ",
            "မမှန်", "အလကား", "လိမ်", "မကောင်းဘူး", "မကောင်းပါ", "မဖြစ်နိုင်"
        ]
        burmglish_debate = re.search(
            r'\b(ma hoke|ma hote|marr nay|mar nay|ma kyeik|ma kyite|ma tu bu|lat ma khan|ma mhan|ma kg bu|ma kaung bu)\b',
            text_lower
        )
        english_debate = re.search(
            r'\b(disagree|wrong|incorrect|false|fake|misleading|bad|terrible|worst|not good|waste of time|cap|bullshit|nope|nah|but actually|however|but)\b',
            text_lower
        )

        if any(kw in text_clean for kw in burmese_debate) or burmglish_debate or english_debate:
            return CommentIntent.DEBATE

        # 3. REQUEST patterns (questions, feature requests, when is next, please, tutorial)
        burmese_request = [
            "ဘယ်တော့", "ဘယ်လို", "သင်ပေး", "တင်ပေး", "လုပ်ပေး", "ပြပေး",
            "ရှင်းပြပေး", "ရှင်းပြ", "လာမှာလဲ", "ပေးပါဦး", "ပေးပါလား", "ပေးပါ",
            "ပါဦး", "ပါလား", "လိုချင်", "သိချင်", "နောက်အပိုင်း", "နောက်ပွဲ"
        ]
        burmglish_request = re.search(
            r'\b(bal tot|bal lo|bello|tin pay|lote pay|pyay pay|shin pya|la hmar ll|kone hmar ll|thee chin|lo chin|nauk pwel|nauk pine|nauk a pine|par lr|par lar|par oo|par ohm|par tone)\b',
            text_lower
        )
        english_request = (
            "?" in text_clean or
            bool(re.search(
                r'\b(how to|how do|how can|can you|could you|please|request|make a video|next video|next part|next episode|where to|what is|when is|tutorial)\b',
                text_lower
            ))
        )

        if any(kw in text_clean for kw in burmese_request) or burmglish_request or english_request:
            return CommentIntent.REQUEST

        # 4. PRAISE patterns (compliments, appreciation, gratitude)
        burmese_praise = [
            "ကောင်းတယ်", "အရမ်းကောင်း", "အကောင်းဆုံး", "ကောင်းလိုက်တာ", "ကျေးဇူး",
            "ကျေးဇူးတင်", "ကျေးဇူးပါ", "မိုက်တယ်", "အရမ်းမိုက်", "ကြိုက်တယ်",
            "အရမ်းကြိုက်", "အသုံးဝင်", "အားပေး", "တော်တယ်", "ဆရာကြီး",
            "သဘောကျ", "ရှင်းတယ်"
        ]
        burmglish_praise = re.search(
            r'\b(kg tal|kaung tal|ar yann|ar yan|kyay zoo|kyay zu|mite tal|mike tal|kyeik tal|arr pay|ar pay|thx|thnk|thx bro)\b',
            text_lower
        )
        english_praise = re.search(
            r'\b(great|awesome|love|loved|thanks|thank you|amazing|excellent|helpful|useful|best|nice|good job|well done|fire|goat|super|enjoyed|informative)\b',
            text_lower
        )

        if any(kw in text_clean for kw in burmese_praise) or burmglish_praise or english_praise:
            return CommentIntent.PRAISE

        return CommentIntent.PRAISE  # Default fallback

    def calculate_sentiment(self, text: str) -> float:
        """Calculates fallback sentiment score between -1.0 and +1.0 based on intent and keywords."""
        intent = self.classify_intent(text)
        if intent == CommentIntent.PRAISE:
            return 0.8
        elif intent == CommentIntent.CONFUSION:
            return -0.2
        elif intent == CommentIntent.DEBATE:
            return -0.5
        elif intent == CommentIntent.REQUEST:
            return 0.1
        return 0.0

    # ── Gemini Multilingual Intelligence Classifier ──────────────

    @classmethod
    def _call_gemini_multilingual_miner(
        cls,
        comments: List[Any],
        channel_handle: Optional[str] = None,
        channel_context: Optional[str] = None,
        user_api_key: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Calls Gemini Flash models to classify audience comments across Burmese/English and synthesize actionable briefs.
        Returns parsed dictionary or None on failure/missing key to enable graceful fallback.
        """
        gemini_key = user_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("YOUTUBE_API_KEY") or getattr(settings, "GEMINI_API_KEY", "") or getattr(settings, "YOUTUBE_API_KEY", "")
        if not gemini_key:
            return None

        if not comments:
            return None

        # Prepare formatted comments snippet
        formatted_comments = []
        for idx, c in enumerate(comments[:60]):
            cid = getattr(c, "comment_id", f"c_{idx}")
            txt = getattr(c, "text_display", str(c))
            likes = getattr(c, "like_count", 0)
            formatted_comments.append(f"[{cid}] (Likes: {likes}): {clean_comment_text(txt)}")

        comments_block = "\n".join(formatted_comments)

        prompt = f"""You are a world-class Multilingual Audience Intelligence and Creator Feedback Classifier.
Your mission is to deeply analyze audience comments across multiple languages including Burmese (Unicode & Romanized Burmglish), English, and mixed multilingual feedback.

Channel Handle: {channel_handle or 'Unknown'}
Channel Context / Niche: {channel_context or 'YouTube Content Creation & Community'}

Audience Comments to analyze:
{comments_block}

Instructions:
1. Multilingual Classification: Classify each comment's primary intent into exactly one of:
   - REQUEST (feature requests, tutorial requests, questions, asking when next episode/match/content will be posted)
   - CONFUSION (unclear explanations, audio/video issues, setup errors, misunderstanding concepts)
   - PRAISE (appreciation, compliments, positive reactions, encouragement)
   - DEBATE (disagreements, constructive critique, counter-arguments, controversial opinions)
2. Sentiment Scoring: Assign a sentiment score between -1.0 (strongly negative) and +1.0 (strongly positive).
3. Dynamic Topic Clustering: Extract specific topics relevant to this channel (e.g. Match Schedule, Audio Quality, Docker Setup, Python Tips, Gameplay, etc.).
4. Actionable Briefs Synthesis:
   - Synthesize top 3-5 'top_feature_requests' into crisp, actionable briefs for the creator.
   - Synthesize top 3-5 'top_confusion_points' into clear actionable briefs indicating what needs clarification or fixing.
5. Calculate overall 'channel_sentiment_index' (-1.0 to 1.0).

Return ONLY valid JSON matching this schema:
{{
  "classifications": [
    {{
      "comment_id": "string",
      "intent": "REQUEST" | "CONFUSION" | "PRAISE" | "DEBATE",
      "sentiment": float (-1.0 to 1.0),
      "topic": "string"
    }}
  ],
  "top_feature_requests": ["string brief 1", "string brief 2"],
  "top_confusion_points": ["string brief 1", "string brief 2"],
  "channel_sentiment_index": float (-1.0 to 1.0)
}}
"""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        for model_name in cls.GEMINI_MODELS:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                r = httpx.post(url, json=payload, timeout=7.0)
                if r.status_code == 429:
                    import time
                    time.sleep(1.0)
                    r = httpx.post(url, json=payload, timeout=7.0)

                if r.status_code == 200:
                    resp_json = r.json()
                    parts = resp_json.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    raw_text = "".join([p["text"] for p in parts if "text" in p and p["text"]]).strip()
                    cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
                    data = json.loads(cleaned_text)
                    logger.info(f"Gemini comment miner succeeded using model {model_name}.")
                    return data
                else:
                    logger.debug(f"Gemini model {model_name} returned status {r.status_code}")
            except Exception as e:
                logger.debug(f"Gemini model {model_name} attempt failed: {e}")
                continue

        return None

    # ── Comment Mining & Persistence ─────────────────────────────

    def mine_comments(self, video_id: str, max_results: int = 100):
        if not self.youtube:
            raise ValueError("YouTube API Key is missing")

        cached = self.db.query(MinedComment).filter(MinedComment.video_id == video_id).all()
        if len(cached) >= max_results:
            return cached[:max_results]

        try:
            request = self.youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=min(max_results, 100)
            )
            response = request.execute()
        except Exception as e:
            return cached

        items = response.get("items", [])
        new_comments = []

        for item in items:
            snippet = item["snippet"]["topLevelComment"]["snippet"]
            comment_id = item["id"]
            
            existing = self.db.query(MinedComment).filter(MinedComment.comment_id == comment_id).first()
            if existing:
                continue

            raw_text = snippet.get("textOriginal") or snippet.get("textDisplay", "")
            text_display = clean_comment_text(raw_text)
            author_name = snippet.get("authorDisplayName", "")
            like_count = snippet.get("likeCount", 0)
            published_at_str = snippet.get("publishedAt", None)
            
            published_at = None
            if published_at_str:
                published_at = dateutil.parser.isoparse(published_at_str).replace(tzinfo=None)
            
            intent = self.classify_intent(text_display)
            sentiment = self.calculate_sentiment(text_display)

            new_comment = MinedComment(
                video_id=video_id,
                comment_id=comment_id,
                author_name=author_name,
                text_display=text_display,
                like_count=like_count,
                published_at=published_at,
                intent_label=intent,
                sentiment_score=sentiment
            )
            self.db.add(new_comment)
            new_comments.append(new_comment)

        self.db.commit()
        
        all_comments = self.db.query(MinedComment).filter(MinedComment.video_id == video_id).all()
        return all_comments[:max_results]

    # ── Channel Intent Aggregation & Actionable Insights ─────────

    def get_channel_intent_distribution(self, channel_handle: str = None):
        """Aggregate channel-wide audience intent distribution, topic heatmap, and mined comments."""
        from app.schemas.creator import (
            IntentDistributionBreakdownDTO, TopicIntentHeatmapCellDTO,
            ChannelIntentDistributionDTO, MinedCommentDTO
        )

        mined_video_ids = []
        if channel_handle and self.youtube:
            clean_handle = channel_handle.strip()
            handle_query = clean_handle if clean_handle.startswith('@') else f"@{clean_handle}"
            ch_id = None
            uploads_pl = None

            try:
                res = self.youtube.channels().list(part="id,contentDetails", forHandle=handle_query).execute()
                if res.get("items"):
                    ch_id = res["items"][0]["id"]
                    uploads_pl = res["items"][0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
            except Exception:
                pass

            if not ch_id:
                try:
                    res = self.youtube.channels().list(part="id,contentDetails", id=clean_handle.lstrip('@')).execute()
                    if res.get("items"):
                        ch_id = res["items"][0]["id"]
                        uploads_pl = res["items"][0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
                except Exception:
                    pass

            if not ch_id:
                try:
                    res = self.youtube.search().list(part="snippet", q=clean_handle, type="channel", maxResults=1).execute()
                    if res.get("items"):
                        ch_id = res["items"][0]["snippet"]["channelId"]
                        ch_details = self.youtube.channels().list(part="contentDetails", id=ch_id).execute()
                        if ch_details.get("items"):
                            uploads_pl = ch_details["items"][0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
                except Exception:
                    pass

            if uploads_pl:
                try:
                    pl_res = self.youtube.playlistItems().list(part="snippet", playlistId=uploads_pl, maxResults=5).execute()
                    items = pl_res.get("items", [])
                    for item in items:
                        vid = item.get("snippet", {}).get("resourceId", {}).get("videoId")
                        if vid:
                            mined_video_ids.append(vid)
                            try:
                                self.mine_comments(vid, max_results=50)
                            except Exception:
                                pass
                except Exception:
                    pass

        if mined_video_ids:
            comments = self.db.query(MinedComment).filter(MinedComment.video_id.in_(mined_video_ids)).all()
        elif channel_handle:
            comments = []
        else:
            comments = self.db.query(MinedComment).all()

        video_ids = set(c.video_id for c in comments) if comments else set(mined_video_ids)
        
        if not video_ids and not comments and not channel_handle:
            try:
                from app.db.models import RawRecord
                raw_vids = self.db.query(RawRecord.video_id).filter(RawRecord.video_id.isnot(None)).distinct().all()
                video_ids = set(v[0] for v in raw_vids if v[0])
            except Exception:
                pass

        total_videos = len(video_ids)
        total_comments = len(comments)

        topics_def = {
            "Setup & Config": ["setup", "config", "install", "environment", "env", "docker"],
            "API & Performance": ["api", "performance", "fast", "slow", "latency", "speed", "endpoint"],
            "Code Examples": ["code", "example", "repo", "github", "syntax", "function"],
            "Tutorial Requests": ["tutorial", "guide", "how to", "please", "make a video", "more"],
            "Troubleshooting": ["error", "bug", "issue", "fail", "broken", "wrong", "fix"]
        }

        if not comments:
            intent_labels = ["PRAISE", "REQUEST", "CONFUSION", "DEBATE"]
            distribution = [
                IntentDistributionBreakdownDTO(
                    intent_label=lbl,
                    count=0,
                    percentage=0.0
                ) for lbl in intent_labels
            ]
            heatmap_cells = [
                TopicIntentHeatmapCellDTO(
                    topic=t_name,
                    intent_label=int_lbl,
                    comment_count=0,
                    heat_score=0.0
                ) for t_name in topics_def for int_lbl in intent_labels
            ]
            return ChannelIntentDistributionDTO(
                total_comments_analyzed=0,
                total_videos_analyzed=total_videos,
                distribution=distribution,
                heatmap=heatmap_cells,
                top_feature_requests=[],
                top_confusion_points=[],
                channel_sentiment_index=0.0,
                mined_comments=[]
            )

        # Sort comments by like_count descending
        sorted_comments = sorted(comments, key=lambda c: (c.like_count or 0), reverse=True)
        mined_comments_dtos = [
            MinedCommentDTO(
                comment_id=c.comment_id,
                author_name=c.author_name,
                text_display=c.text_display,
                like_count=c.like_count or 0,
                published_at=c.published_at,
                intent_label=c.intent_label.value if hasattr(c.intent_label, "value") else c.intent_label,
                sentiment_score=c.sentiment_score
            )
            for c in sorted_comments
        ]

        # Active DB Comments Processing
        intent_counts = {"REQUEST": 0, "CONFUSION": 0, "PRAISE": 0, "DEBATE": 0}
        for c in comments:
            label = c.intent_label.value if hasattr(c.intent_label, "value") else str(c.intent_label)
            if label in intent_counts:
                intent_counts[label] += 1
            else:
                intent_counts["PRAISE"] += 1

        distribution = []
        for label, cnt in intent_counts.items():
            pct = round((cnt / total_comments * 100.0), 1) if total_comments > 0 else 0.0
            distribution.append(IntentDistributionBreakdownDTO(
                intent_label=label,
                count=cnt,
                percentage=pct
            ))

        heatmap_cells = []
        topic_intent_matrix = {t: {i: 0 for i in intent_counts} for t in topics_def}

        for c in comments:
            txt = c.text_display.lower()
            label = c.intent_label.value if hasattr(c.intent_label, "value") else str(c.intent_label)
            if label not in intent_counts:
                label = "PRAISE"

            matched_topic = False
            for top_name, keywords in topics_def.items():
                if any(kw in txt for kw in keywords):
                    topic_intent_matrix[top_name][label] += 1
                    matched_topic = True

            if not matched_topic:
                topic_intent_matrix["Tutorial Requests"][label] += 1

        for top_name, intents_dict in topic_intent_matrix.items():
            max_in_topic = max(intents_dict.values()) or 1
            for int_lbl, cnt in intents_dict.items():
                heat = round(min(100.0, (cnt / max_in_topic) * 100.0), 1) if cnt > 0 else 0.0
                heatmap_cells.append(TopicIntentHeatmapCellDTO(
                    topic=top_name,
                    intent_label=int_lbl,
                    comment_count=cnt,
                    heat_score=heat
                ))

        req_comments = [c for c in comments if (hasattr(c.intent_label, "value") and c.intent_label.value == "REQUEST") or str(c.intent_label) == "REQUEST"]
        conf_comments = [c for c in comments if (hasattr(c.intent_label, "value") and c.intent_label.value == "CONFUSION") or str(c.intent_label) == "CONFUSION"]

        req_comments.sort(key=lambda x: x.like_count or 0, reverse=True)
        conf_comments.sort(key=lambda x: x.like_count or 0, reverse=True)

        top_requests = [
            clean_comment_text(c.text_display)[:220] + ('...' if len(clean_comment_text(c.text_display)) > 220 else '')
            for c in req_comments[:3]
        ]
        top_confusions = [
            clean_comment_text(c.text_display)[:220] + ('...' if len(clean_comment_text(c.text_display)) > 220 else '')
            for c in conf_comments[:3]
        ]

        sentiment_scores = [c.sentiment_score for c in comments if c.sentiment_score is not None]
        avg_sentiment = round(sum(sentiment_scores) / len(sentiment_scores), 2) if sentiment_scores else 0.0

        return ChannelIntentDistributionDTO(
            total_comments_analyzed=total_comments,
            total_videos_analyzed=total_videos,
            distribution=distribution,
            heatmap=heatmap_cells,
            top_feature_requests=top_requests,
            top_confusion_points=top_confusions,
            channel_sentiment_index=avg_sentiment,
            mined_comments=mined_comments_dtos
        )
