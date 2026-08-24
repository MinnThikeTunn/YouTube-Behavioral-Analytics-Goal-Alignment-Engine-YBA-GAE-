import os
import html
import re
from datetime import datetime
import dateutil.parser
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from app.db.models import MinedComment, CommentIntent

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
    def __init__(self, db: Session, api_key: str = None):
        from app.config import settings
        self.db = db
        self.api_key = api_key or os.environ.get("YOUTUBE_API_KEY") or settings.YOUTUBE_API_KEY
        self.youtube = build('youtube', 'v3', developerKey=self.api_key) if self.api_key else None

    def classify_intent(self, text: str) -> CommentIntent:
        text_lower = text.lower()
        if "?" in text or "how to" in text_lower or "please" in text_lower or "can you" in text_lower:
            return CommentIntent.REQUEST
        elif "confused" in text_lower or "don't understand" in text_lower or "make sense" in text_lower:
            return CommentIntent.CONFUSION
        elif "great" in text_lower or "awesome" in text_lower or "love" in text_lower or "thanks" in text_lower:
            return CommentIntent.PRAISE
        elif "disagree" in text_lower or "wrong" in text_lower or "but" in text_lower:
            return CommentIntent.DEBATE
        return CommentIntent.PRAISE # Default fallback

    def calculate_sentiment(self, text: str) -> float:
        intent = self.classify_intent(text)
        if intent == CommentIntent.PRAISE:
            return 0.8
        elif intent == CommentIntent.CONFUSION:
            return -0.2
        elif intent == CommentIntent.DEBATE:
            return -0.5
        return 0.1

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

    def get_channel_intent_distribution(self, channel_handle: str = None):
        """Aggregate channel-wide audience intent distribution and topic heatmap dynamically from real comments."""
        from app.schemas.creator import (
            IntentDistributionBreakdownDTO, TopicIntentHeatmapCellDTO, ChannelIntentDistributionDTO
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
        else:
            comments = self.db.query(MinedComment).all()

        video_ids = set(c.video_id for c in comments) if comments else set(mined_video_ids)
        
        if not video_ids and not comments:
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
            # Accurately reflect channels that have 0 comments on YouTube
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
                channel_sentiment_index=0.0
            )

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
            channel_sentiment_index=avg_sentiment
        )



