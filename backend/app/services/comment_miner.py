import os
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from app.db.models import MinedComment, CommentIntent
from datetime import datetime
import dateutil.parser

class CommentMinerService:
    def __init__(self, db: Session, api_key: str = None):
        self.db = db
        self.api_key = api_key or os.environ.get("YOUTUBE_API_KEY")
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

            text_display = snippet.get("textDisplay", "")
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
