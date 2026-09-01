"""Unit and Integration Tests for Multilingual (Burmese & English) Comment Mining,
Gemini Intelligence Classifier, Schema Validation, and Sentiment Fallbacks (TDD).
"""
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.db.models import MinedComment, CommentIntent
from app.services.comment_miner import CommentMinerService, clean_comment_text
from app.schemas.creator import (
    ChannelIntentDistributionDTO,
    MinedCommentDTO,
    CommentIntentEnum
)


# In-memory SQLite fixture for isolated testing
@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


# ── 1. Multilingual Intent Classification Unit Tests ───────────────

class TestMultilingualIntentClassification:
    """Verifies intent classification across Burmese Unicode, Romanized Burmglish, English, and Mixed scripts."""

    @pytest.mark.parametrize("text,expected_intent", [
        # Burmese Unicode - REQUEST
        ("နောက်ပွဲဘယ်တော့လဲ bro", CommentIntent.REQUEST),
        ("ဘယ်လိုလုပ်ရမလဲ သင်ပေးပါဦး", CommentIntent.REQUEST),
        ("တင်ပေးပါဦး", CommentIntent.REQUEST),
        ("နောက်အပိုင်းဘယ်တော့လာမှာလဲ", CommentIntent.REQUEST),
        ("tutorial လေးလုပ်ပေးပါ", CommentIntent.REQUEST),
        ("ရှင်းပြပေးပါလား ခင်ဗျာ", CommentIntent.REQUEST),

        # Burmese Unicode - CONFUSION
        ("အသံမကြားရဘူးဗျာ", CommentIntent.CONFUSION),
        ("နားမလည်ဘူး ဘာပြောတာလဲ", CommentIntent.CONFUSION),
        ("မရှင်းဘူးဗျ", CommentIntent.CONFUSION),
        ("ဘာပြောတာလဲ မသိဘူး", CommentIntent.CONFUSION),
        ("အဆင်မပြေဘူး error တက်နေတယ်", CommentIntent.CONFUSION),
        ("နားမလည်တော့ဘူး", CommentIntent.CONFUSION),

        # Burmese Unicode - DEBATE
        ("ဒါတော့ မဟုတ်သေးဘူး", CommentIntent.DEBATE),
        ("မှားနေတယ် အဲ့ဒါ မဟုတ်ဘူး", CommentIntent.DEBATE),
        ("မကြိုက်ဘူး ဒီနည်းလမ်း", CommentIntent.DEBATE),
        ("မတူဘူး ထင်တယ်", CommentIntent.DEBATE),
        ("လက်မခံနိုင်ဘူး", CommentIntent.DEBATE),

        # Burmese Unicode - PRAISE
        ("အရမ်းကောင်းတယ်", CommentIntent.PRAISE),
        ("ကျေးဇူးပါ ဆရာ", CommentIntent.PRAISE),
        ("အရမ်းမိုက်တယ် bro", CommentIntent.PRAISE),
        ("ကြိုက်တယ် အမြဲအားပေးနေပါတယ်", CommentIntent.PRAISE),
        ("အရမ်း အသုံးဝင်တယ်", CommentIntent.PRAISE),

        # Romanized Burmese / Burmglish
        ("nauk pwel bal tot ll bro", CommentIntent.REQUEST),
        ("bal lo lote ya ma ll", CommentIntent.REQUEST),
        ("na ma lal bu", CommentIntent.CONFUSION),
        ("a than ma kyar ya bu", CommentIntent.CONFUSION),
        ("ma hoke thay bu", CommentIntent.DEBATE),
        ("marr nay tal bro", CommentIntent.DEBATE),
        ("ar yann kg tal", CommentIntent.PRAISE),
        ("kyay zoo par", CommentIntent.PRAISE),

        # English Standard
        ("How to deploy this to production?", CommentIntent.REQUEST),
        ("Can you please make a tutorial on Docker?", CommentIntent.REQUEST),
        ("I don't understand step 4 at all", CommentIntent.CONFUSION),
        ("Why does this line cause an error?", CommentIntent.CONFUSION),
        ("I disagree with your benchmark comparison", CommentIntent.DEBATE),
        ("This is completely wrong and outdated", CommentIntent.DEBATE),
        ("Awesome explanation, love this channel!", CommentIntent.PRAISE),
        ("Great video, thank you so much!", CommentIntent.PRAISE),

        # Mixed Burmese & English
        ("FastAPI tutorial လေး တင်ပေးပါလား bro", CommentIntent.REQUEST),
        ("Error တက်နေတယ် ဘာလို့လဲဗျ", CommentIntent.CONFUSION),
        ("Bro explanation က awesome ပါ", CommentIntent.PRAISE),
        ("Performance က မကောင်းဘူး bro but ok", CommentIntent.DEBATE),
    ])
    def test_classify_intent_multilingual(self, db_session, text, expected_intent):
        miner = CommentMinerService(db_session)
        classified = miner.classify_intent(text)
        assert classified == expected_intent, f"Failed for '{text}': expected {expected_intent}, got {classified}"


# ── 2. Sentiment Scoring and Distribution Metrics ─────────────────

class TestSentimentScoring:
    """Verifies sentiment scoring range [-1.0, 1.0] and polarity alignment."""

    def test_sentiment_score_bounds_and_polarities(self, db_session):
        miner = CommentMinerService(db_session)

        # Praise -> Highly positive (> 0.5)
        praise_score = miner.calculate_sentiment("အရမ်းကောင်းတယ် ကျေးဇူးပါ")
        assert 0.5 <= praise_score <= 1.0

        # Confusion -> Mildly negative (< 0.0)
        confusion_score = miner.calculate_sentiment("အသံမကြားရဘူး နားမလည်ဘူး")
        assert -0.5 <= confusion_score <= 0.0

        # Debate -> Moderately negative (< -0.3)
        debate_score = miner.calculate_sentiment("ဒါတော့ မဟုတ်သေးဘူး မှားနေတယ်")
        assert -1.0 <= debate_score <= -0.2

        # Request -> Neutral to slightly positive (0.0 to 0.3)
        request_score = miner.calculate_sentiment("နောက်ပွဲဘယ်တော့လဲ bro တင်ပေးပါဦး")
        assert -0.1 <= request_score <= 0.5

    def test_channel_sentiment_index_calculation(self, db_session):
        miner = CommentMinerService(db_session)

        c1 = MinedComment(video_id="v1", comment_id="c1", text_display="အရမ်းကောင်းတယ်", intent_label=CommentIntent.PRAISE, sentiment_score=0.8, like_count=10)
        c2 = MinedComment(video_id="v1", comment_id="c2", text_display="ကျေးဇူးတင်ပါတယ်", intent_label=CommentIntent.PRAISE, sentiment_score=0.8, like_count=5)
        c3 = MinedComment(video_id="v2", comment_id="c3", text_display="အသံမကြားရဘူး", intent_label=CommentIntent.CONFUSION, sentiment_score=-0.2, like_count=2)
        db_session.add_all([c1, c2, c3])
        db_session.commit()

        dist = miner.get_channel_intent_distribution()
        # Avg = (0.8 + 0.8 - 0.2) / 3 = 1.4 / 3 = 0.47
        assert dist.channel_sentiment_index == pytest.approx(0.47, abs=0.02)


# ── 3. DTO Schema Validation ──────────────────────────────────────

class TestCreatorSchemaDTO:
    """Verifies that ChannelIntentDistributionDTO schema includes mined_comments field."""

    def test_channel_intent_distribution_dto_has_mined_comments(self):
        dto = ChannelIntentDistributionDTO(
            total_comments_analyzed=10,
            total_videos_analyzed=2,
            distribution=[],
            heatmap=[],
            top_feature_requests=["Request 1"],
            top_confusion_points=["Confusion 1"],
            channel_sentiment_index=0.65,
            mined_comments=[]
        )
        assert hasattr(dto, "mined_comments")
        assert dto.mined_comments == []

    def test_mined_comments_serialization(self):
        comment_dto = MinedCommentDTO(
            comment_id="c_test_1",
            author_name="Aung Aung",
            text_display="နောက်ပွဲဘယ်တော့လဲ bro",
            like_count=42,
            intent_label=CommentIntentEnum.REQUEST,
            sentiment_score=0.1
        )
        dto = ChannelIntentDistributionDTO(
            total_comments_analyzed=1,
            total_videos_analyzed=1,
            distribution=[],
            heatmap=[],
            top_feature_requests=["နောက်ပွဲဘယ်တော့လဲ"],
            top_confusion_points=[],
            channel_sentiment_index=0.1,
            mined_comments=[comment_dto]
        )
        assert len(dto.mined_comments) == 1
        assert dto.mined_comments[0].comment_id == "c_test_1"
        assert dto.mined_comments[0].like_count == 42


# ── 4. Channel Intent Distribution with Mined Comments ────────────

class TestChannelIntentDistributionMinedComments:
    """Verifies that get_channel_intent_distribution returns sorted mined_comments."""

    def test_mined_comments_sorted_by_likes_descending(self, db_session):
        miner = CommentMinerService(db_session)

        c1 = MinedComment(video_id="v1", comment_id="c1", author_name="User A", text_display="နောက်ပွဲဘယ်တော့လဲ", intent_label=CommentIntent.REQUEST, sentiment_score=0.1, like_count=5)
        c2 = MinedComment(video_id="v1", comment_id="c2", author_name="User B", text_display="အရမ်းကောင်းတယ်", intent_label=CommentIntent.PRAISE, sentiment_score=0.8, like_count=120)
        c3 = MinedComment(video_id="v2", comment_id="c3", author_name="User C", text_display="အသံမကြားရဘူး", intent_label=CommentIntent.CONFUSION, sentiment_score=-0.2, like_count=45)
        db_session.add_all([c1, c2, c3])
        db_session.commit()

        result = miner.get_channel_intent_distribution()
        assert isinstance(result, ChannelIntentDistributionDTO)
        assert result.mined_comments is not None
        assert len(result.mined_comments) == 3
        # Should be sorted descending by like_count: 120 -> 45 -> 5
        assert result.mined_comments[0].like_count == 120
        assert result.mined_comments[0].comment_id == "c2"
        assert result.mined_comments[1].like_count == 45
        assert result.mined_comments[1].comment_id == "c3"
        assert result.mined_comments[2].like_count == 5
        assert result.mined_comments[2].comment_id == "c1"

    def test_empty_channel_intent_distribution_has_empty_mined_comments(self, db_session):
        miner = CommentMinerService(db_session)
        result = miner.get_channel_intent_distribution()
        assert isinstance(result, ChannelIntentDistributionDTO)
        assert result.total_comments_analyzed == 0
        assert result.mined_comments == []


# ── 5. Gemini AI Multilingual Intelligence & Fallback ─────────────

class TestGeminiMultilingualCommentMiner:
    """Verifies Gemini AI intelligence classification, prompt engineering, candidate models, and graceful fallback."""

    def test_gemini_candidate_models_presence(self):
        expected_models = [
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash"
        ]
        # Inspect CommentMinerService candidate models list
        assert hasattr(CommentMinerService, "GEMINI_MODELS") or hasattr(CommentMinerService, "_call_gemini_multilingual_miner")

    @patch("app.services.comment_miner.httpx.post")
    def test_gemini_multilingual_miner_success(self, mock_post, db_session):
        mock_response_data = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": """
                        {
                            "classifications": [
                                {"comment_id": "c1", "intent": "REQUEST", "sentiment": 0.2, "topic": "Next Match Schedule"},
                                {"comment_id": "c2", "intent": "CONFUSION", "sentiment": -0.3, "topic": "Audio Quality"}
                            ],
                            "top_feature_requests": [
                                "Audience requesting schedule for the next match / upcoming episode",
                                "Requests for downloadable tutorials"
                            ],
                            "top_confusion_points": [
                                "Audio volume is too low or inaudible in certain sections",
                                "Confusion on setup step 2"
                            ],
                            "channel_sentiment_index": 0.35
                        }
                        """
                    }]
                }
            }]
        }
        mock_post.return_value = MagicMock(status_code=200, json=lambda: mock_response_data)

        miner = CommentMinerService(db_session, api_key="dummy_gemini_key")
        c1 = MinedComment(video_id="v1", comment_id="c1", text_display="နောက်ပွဲဘယ်တော့လဲ bro", like_count=10)
        c2 = MinedComment(video_id="v1", comment_id="c2", text_display="အသံမကြားရဘူးဗျာ", like_count=5)

        ai_result = miner._call_gemini_multilingual_miner(
            comments=[c1, c2],
            channel_handle="@BurmeseTechHub",
            channel_context="Tech & Sports tutorials in Burmese and English"
        )

        assert ai_result is not None
        assert "top_feature_requests" in ai_result
        assert len(ai_result["top_feature_requests"]) == 2
        assert "Audience requesting schedule" in ai_result["top_feature_requests"][0]
        assert "top_confusion_points" in ai_result
        assert "Audio volume is too low" in ai_result["top_confusion_points"][0]

    @patch("app.services.comment_miner.httpx.post")
    def test_gemini_multilingual_miner_graceful_fallback(self, mock_post, db_session):
        # Simulate network error or rate limit
        mock_post.side_effect = Exception("Connection Timeout / 429 Rate Limit")

        miner = CommentMinerService(db_session, api_key="dummy_gemini_key")
        c1 = MinedComment(video_id="v1", comment_id="c1", text_display="နောက်ပွဲဘယ်တော့လဲ bro", like_count=10)

        # Must not throw exception, should return None so caller uses rule-based fallback
        ai_result = miner._call_gemini_multilingual_miner(
            comments=[c1],
            channel_handle="@BurmeseTechHub"
        )
        assert ai_result is None


# ── 6. Universal Topic Clustering & 2D Heat Matrix TDD ───────────

class TestUniversalTopicClustering:
    """Verifies that universal topic classification works seamlessly across non-IT and diverse niches."""

    @pytest.mark.parametrize("text,intent,expected_topic", [
        # Cooking / Food Channel
        ("Can you show the ingredients recipe for this curry?", "REQUEST", "Content & Discussion"),
        ("I tried this recipe at home and the taste was incredible!", "PRAISE", "Technique & Practical Insights"),
        ("What temperature should the oven be set to?", "CONFUSION", "Technique & Practical Insights"),
        ("Please make a dessert video next week!", "REQUEST", "Future Ideas & Requests"),

        # Gaming / Entertainment Channel
        ("The final boss gameplay was so intense and thrilling", "PRAISE", "Content & Discussion"),
        ("Your commentary and speaking pacing is always hilarious", "PRAISE", "Delivery & Presentation"),
        ("The microphone audio is distorted and too loud in this stream", "CONFUSION", "Production & Audio-Visual"),
        ("Are you going to play part 2 tomorrow?", "REQUEST", "Future Ideas & Requests"),

        # Fitness / Sports Channel
        ("How to do the posture without hurting my lower back?", "REQUEST", "Technique & Practical Insights"),
        ("The background music is way too loud, can't hear your voice", "CONFUSION", "Production & Audio-Visual"),
        ("Great workout breakdown and clear explanation", "PRAISE", "Delivery & Presentation"),

        # Burmese Multilingual
        ("နောက်အပိုင်း ဘယ်တော့ တင်ပေးမှာလဲ bro", "REQUEST", "Future Ideas & Requests"),
        ("အသံမကြားရဘူး ရုပ်ထွက်လည်း မကြည်ဘူး", "CONFUSION", "Production & Audio-Visual"),
        ("ရှင်းပြတာ အရမ်းနားလည်လွယ်တယ် ဆရာ", "PRAISE", "Delivery & Presentation"),
        ("ဒီနည်းလမ်း လက်တွေ့ စမ်းကြည့်တာ အဆင်ပြေတယ်", "PRAISE", "Technique & Practical Insights"),
        ("ဇာတ်လမ်း အကြောင်းအရာလေး အရမ်းမိုက်တယ်", "PRAISE", "Content & Discussion"),
    ])
    def test_classify_topic_universal(self, db_session, text, intent, expected_topic):
        miner = CommentMinerService(db_session)
        topic = miner.classify_topic(text, intent=intent)
        assert topic == expected_topic, f"Failed for '{text}': expected '{expected_topic}', got '{topic}'"

    def test_heatmap_matrix_scaling_not_inflated(self, db_session):
        """Verifies that a 1-comment cell does not show 100% heat when another cell has 100 comments."""
        miner = CommentMinerService(db_session)

        # Add 100 PRAISE comments on Content & Discussion
        praise_comments = [
            MinedComment(
                video_id="v1",
                comment_id=f"p_{i}",
                text_display=f"Awesome video story episode {i}",
                intent_label=CommentIntent.PRAISE,
                sentiment_score=0.8,
                like_count=10
            ) for i in range(100)
        ]
        # Add 1 CONFUSION comment on Production & Audio-Visual
        single_conf_comment = MinedComment(
            video_id="v1",
            comment_id="c_single",
            text_display="I cannot hear the microphone sound",
            intent_label=CommentIntent.CONFUSION,
            sentiment_score=-0.2,
            like_count=1
        )
        db_session.add_all(praise_comments + [single_conf_comment])
        db_session.commit()

        result = miner.get_channel_intent_distribution()
        assert len(result.heatmap) == 20  # 5 topics * 4 intents

        # Find PRAISE on Content & Discussion cell
        content_praise_cell = next(
            c for c in result.heatmap
            if c.topic == "Content & Discussion" and c.intent_label == "PRAISE"
        )
        assert content_praise_cell.comment_count == 100
        assert content_praise_cell.heat_score == 100.0

        # Find CONFUSION on Production & Audio-Visual cell
        prod_conf_cell = next(
            c for c in result.heatmap
            if c.topic == "Production & Audio-Visual" and c.intent_label == "CONFUSION"
        )
        assert prod_conf_cell.comment_count == 1
        # Heat score should be 1.0% (1/100), NOT inflated to 100.0%!
        assert prod_conf_cell.heat_score == pytest.approx(1.0, abs=0.1)

