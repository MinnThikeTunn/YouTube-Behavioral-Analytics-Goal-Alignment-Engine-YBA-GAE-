"""Tests for Creator Intelligence Engine additions: Vision Analyzer, Channel Intent Heatmap, 8-Factor Spider Radar, and Closed-Loop Telemetry Sync."""
import io
import pytest
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db.session import Base, get_db
from app.db.models import MinedComment, CommentIntent, VASEvaluation, VASPostPublishTelemetry
from app.services.packaging_optimizer import PackagingOptimizerService
from app.services.comment_miner import CommentMinerService
from app.schemas.vas import (
    VASEvalRequestDTO, ClosedLoopSyncRequestDTO,
    ThumbnailVisionResultDTO, Composite8FactorScoreDTO, ClosedLoopTelemetryResultDTO
)
from app.schemas.creator import ChannelIntentDistributionDTO
from app.main import app


# In-memory SQLite test session
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def _override_db():
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)


client = TestClient(app)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Feature 1: Thumbnail Vision Image Upload & Analyzer ──

def test_analyze_thumbnail_image_bytes():
    # Create sample image bytes in memory
    img = Image.new("RGB", (200, 200), color=(255, 87, 51))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    contents = buf.getvalue()

    result = PackagingOptimizerService.analyze_thumbnail_image(contents)
    assert isinstance(result, ThumbnailVisionResultDTO)
    assert 0.0 <= result.brightness <= 1.0
    assert 0.0 <= result.contrast <= 1.0
    assert 0.0 <= result.color_saturation <= 1.0
    assert result.readability_grade in ("EXCELLENT", "GOOD", "FAIR", "POOR")
    assert len(result.dominant_colors) > 0


def test_thumbnail_analyze_endpoint():
    img = Image.new("RGB", (100, 100), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/api/v1/creator/thumbnail-analyze",
        files={"file": ("test.png", buf, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "visual_impact_score" in data
    assert "legibility_score" in data
    assert "dominant_colors" in data


# ── Feature 2: Channel Intent Distribution & Heatmap ──

def test_channel_intent_distribution(db):
    miner = CommentMinerService(db)

    # Seed comments
    c1 = MinedComment(video_id="v1", comment_id="c1", text_display="How to setup Docker?", intent_label=CommentIntent.REQUEST, sentiment_score=0.2)
    c2 = MinedComment(video_id="v1", comment_id="c2", text_display="I am confused about step 2", intent_label=CommentIntent.CONFUSION, sentiment_score=-0.2)
    c3 = MinedComment(video_id="v2", comment_id="c3", text_display="Awesome tutorial thanks!", intent_label=CommentIntent.PRAISE, sentiment_score=0.9)
    db.add_all([c1, c2, c3])
    db.commit()

    res = miner.get_channel_intent_distribution()
    assert isinstance(res, ChannelIntentDistributionDTO)
    assert res.total_comments_analyzed == 3
    assert res.total_videos_analyzed == 2
    assert len(res.distribution) == 4
    assert len(res.heatmap) > 0


def test_channel_intent_distribution_endpoint():
    response = client.get("/api/v1/creator/channel-intent-distribution")
    assert response.status_code == 200
    data = response.json()
    assert "distribution" in data
    assert "heatmap" in data
    assert "top_feature_requests" in data
    assert "top_confusion_points" in data


# ── Feature 3: 8-Factor Composite Score Breakdown ──

def test_calculate_composite_8factor(db):
    req = VASEvalRequestDTO(
        title="Why Most Developers Fail at FastAPI Deployment",
        hook_script="In this video I will show you the exact secrets to sub-12ms model deployment.",
        thumbnail_brightness=0.6,
        thumbnail_contrast=0.7
    )
    res = PackagingOptimizerService.calculate_composite_8factor(req, db)
    assert isinstance(res, Composite8FactorScoreDTO)
    assert len(res.factors) == 8
    assert 0.0 <= res.composite_overall_score <= 100.0


def test_composite_score_endpoint():
    payload = {
        "title": "Top 7 AI Coding Workflows in 2026",
        "hook_script": "What if you could automate your entire dev pipeline in under 5 minutes?",
        "thumbnail_brightness": 0.65,
        "thumbnail_contrast": 0.75
    }
    response = client.post("/api/v1/creator/composite-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "composite_overall_score" in data
    assert len(data["factors"]) == 8


# ── Feature 4: Telemetry Sync & Auto-Tuning Engine ──

def test_sync_telemetry_and_autotune(db):
    req = ClosedLoopSyncRequestDTO(
        actual_ctr=8.2,
        actual_retention_30s=65.0,
        actual_views=12500
    )
    res = PackagingOptimizerService.sync_telemetry_and_autotune(req, db)
    assert isinstance(res, ClosedLoopTelemetryResultDTO)
    assert res.status in ("OPTIMAL", "TUNING_ACTIVE")
    assert "w1_title" in res.tuned_weights
    assert res.total_evaluations >= 1

    # Verify DB persistence
    telemetry = db.query(VASPostPublishTelemetry).first()
    assert telemetry is not None
    assert telemetry.actual_ctr == 8.2
    assert telemetry.actual_views == 12500


def test_closed_loop_sync_endpoint():
    payload = {
        "actual_ctr": 9.1,
        "actual_retention_30s": 72.5,
        "actual_views": 45000
    }
    response = client.post("/api/v1/creator/closed-loop/sync", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "tuned_weights" in data
    assert "message" in data


# ── Dynamic Creator Intelligence & Tavily Integration Tests ──

def test_dynamic_niche_trends_endpoint():
    response = client.get("/api/v1/creator/trends")
    assert response.status_code == 200
    data = response.json()
    assert "trends" in data
    assert "overall_market_sentiment" in data
    assert len(data["trends"]) > 0
    first_trend = data["trends"][0]
    assert "niche_name" in first_trend
    assert "trend_velocity" in first_trend
    assert first_trend["trajectory"] in ("EXPLODING", "RISING", "STABLE", "DECLINING")


def test_dynamic_video_opportunities_endpoint():
    response = client.get("/api/v1/creator/opportunity")
    assert response.status_code == 200
    data = response.json()
    assert "opportunities" in data
    assert "avg_vos_score" in data
    assert len(data["opportunities"]) > 0
    first_opp = data["opportunities"][0]
    assert "topic" in first_opp
    assert "demand_index" in first_opp
    assert "vos_score" in first_opp
    assert "goal_alignment_score" in first_opp
    assert 0.0 <= first_opp["goal_alignment_score"] <= 100.0


def test_tavily_search_service():
    from app.services.tavily_search import TavilySearchService
    tavily = TavilySearchService()
    trends = tavily.search_niche_trends()
    assert len(trends) > 0
    assert "niche_name" in trends[0]
    assert "delta_views" in trends[0]

    opps = tavily.search_opportunity_topics()
    assert len(opps) > 0
    assert "topic" in opps[0]
    assert "recommended_titles" in opps[0]


def test_goal_alignment_opportunity_scoring():
    from app.services.opportunity_engine import OpportunityEngine
    engine = OpportunityEngine()
    score = engine.score_goal_alignment(
        topic="Autonomous AI Coding Agents",
        titles=["Building Claude-Code Powered Workflows"]
    )
    assert 50.0 <= score <= 100.0

    vos = engine.calculate_vos(demand_index=9.0, competitor_density=0.4, goal_alignment_score=88.0)
    # VOS = 0.35 * 9.0 + 0.35 * 8.8 + 0.30 * (10.0 - 0.4) = 3.15 + 3.08 + 2.88 = 9.11
    assert 8.0 <= vos <= 10.5

