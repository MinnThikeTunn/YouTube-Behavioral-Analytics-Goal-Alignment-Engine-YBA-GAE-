import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.db.models import MinedComment, CommentIntent
from app.services.comment_miner import CommentMinerService

# Setup in-memory sqlite db
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_intent_classification(db):
    miner = CommentMinerService(db, api_key="dummy")
    
    assert miner.classify_intent("How to do this?") == CommentIntent.REQUEST
    assert miner.classify_intent("I am confused about this") == CommentIntent.CONFUSION
    assert miner.classify_intent("This is awesome thanks!") == CommentIntent.PRAISE
    assert miner.classify_intent("I disagree with your point") == CommentIntent.DEBATE

def test_save_and_retrieve_comment(db):
    comment = MinedComment(
        video_id="test_vid",
        comment_id="c1",
        author_name="User",
        text_display="Great video!",
        intent_label=CommentIntent.PRAISE,
        sentiment_score=0.8
    )
    db.add(comment)
    db.commit()
    
    retrieved = db.query(MinedComment).filter(MinedComment.video_id == "test_vid").first()
    assert retrieved is not None
    assert retrieved.comment_id == "c1"
    assert retrieved.intent_label == CommentIntent.PRAISE

from app.services.trend_radar import TrendRadarEngine
from fastapi.testclient import TestClient
from app.main import app

def test_trend_radar_engine():
    engine = TrendRadarEngine(w1=0.5, w2=0.3, w3=0.2)
    vel = engine.calculate_velocity(0.9, 0.7, 0.8)
    assert vel == pytest.approx(0.82)
    
    traj = engine.determine_trajectory(0.82)
    assert traj == "EXPLODING"
    
    traj_rising = engine.determine_trajectory(0.5)
    assert traj_rising == "RISING"

    traj_stable = engine.determine_trajectory(0.1)
    assert traj_stable == "STABLE"

    traj_declining = engine.determine_trajectory(-0.3)
    assert traj_declining == "DECLINING"

client = TestClient(app)

def test_get_niche_trends():
    response = client.get("/api/v1/creator/trends")
    assert response.status_code == 200
    data = response.json()
    assert "trends" in data
    assert "overall_market_sentiment" in data
    assert len(data["trends"]) > 0
    assert data["trends"][0]["trajectory"] in ["EXPLODING", "RISING", "STABLE", "DECLINING"]

from app.services.opportunity_engine import OpportunityEngine

def test_opportunity_engine():
    engine = OpportunityEngine()
    vos = engine.calculate_vos(demand_index=8.5, competitor_density=0.4)
    assert vos == 17.0
    
    tier_high = engine.determine_tier(vos_score=5.5)
    assert tier_high == "HIGH_OPPORTUNITY"
    
    tier_mod = engine.determine_tier(vos_score=3.5)
    assert tier_mod == "MODERATE"
    
    tier_sat = engine.determine_tier(vos_score=1.5)
    assert tier_sat == "SATURATED"
