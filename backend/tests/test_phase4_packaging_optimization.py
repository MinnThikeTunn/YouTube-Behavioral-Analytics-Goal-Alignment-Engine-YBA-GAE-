"""Phase 4 — Packaging Optimization & Closed-Loop Engine Tests."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db.session import Base
from app.db.models import VASEvaluation
from app.services.packaging_optimizer import PackagingOptimizerService
from app.schemas.vas import VASEvalRequestDTO
from app.main import app
from app.db.session import get_db


# ── In-memory SQLite test session (StaticPool shares single connection) ──
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
    """Set app dependency override for this test module only, cleanup after."""
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



# ── Title Scoring Tests ────────────────────────────────────────
def test_title_scoring():
    svc = PackagingOptimizerService

    # Short title (< 25 chars) should get penalized
    short_score = svc.calculate_title_score("AI Tips")
    assert 0 <= short_score <= 100

    # Optimal length with curiosity and power words
    strong_title = "Why Most Developers Never Master the Ultimate FastAPI Secret"
    strong_score = svc.calculate_title_score(strong_title)
    assert strong_score > 70.0, f"Strong title scored too low: {strong_score}"

    # Question hook bonus
    question_title = "How to Build AI Agents Step-by-Step?"
    question_score = svc.calculate_title_score(question_title)
    # Should get question bonus
    plain_title = "How to Build AI Agents Step-by-Step"
    plain_score = svc.calculate_title_score(plain_title)
    assert question_score > plain_score

    # Number bonus
    numbered_title = "Top 10 FastAPI Deployment Secrets You Need"
    numbered_score = svc.calculate_title_score(numbered_title)
    assert numbered_score > 60.0


# ── Hook Script Scoring Tests ──────────────────────────────────
def test_hook_scoring():
    svc = PackagingOptimizerService

    # Too short hook
    short_hook = "Hello world"
    short_score = svc.calculate_hook_score(short_hook)
    assert short_score < 50.0

    # Optimal length hook with hook phrases
    good_hook = (
        "In this video I am going to show you something most people don't know about. "
        "What if I told you that your deployment pipeline has a critical mistake that costs "
        "you hours every week? Imagine being able to deploy your FastAPI models in under "
        "twelve milliseconds on a single CPU core. Here's why nobody talks about this approach "
        "and how you can implement it today in your own projects right now."
    )
    good_score = svc.calculate_hook_score(good_hook)
    assert good_score > 55.0, f"Good hook scored too low: {good_score}"


# ── VAS Composite Formula Tests ────────────────────────────────
def test_vas_calculation():
    svc = PackagingOptimizerService

    # Default weights: w1=0.40, w2=0.35, w3=0.25
    vas = svc.calculate_vas(80.0, 70.0, 60.0)
    expected = 0.40 * 80.0 + 0.35 * 70.0 + 0.25 * 60.0  # 32+24.5+15 = 71.5
    assert vas == pytest.approx(expected, abs=0.1)

    # Custom weights
    vas_custom = svc.calculate_vas(90.0, 50.0, 80.0, w1=0.5, w2=0.3, w3=0.2)
    expected_custom = 0.5 * 90.0 + 0.3 * 50.0 + 0.2 * 80.0  # 45+15+16 = 76.0
    assert vas_custom == pytest.approx(expected_custom, abs=0.1)


# ── Thumbnail Scoring Tests ───────────────────────────────────
def test_thumbnail_scoring():
    svc = PackagingOptimizerService

    # Optimal brightness and contrast
    optimal = svc.calculate_thumbnail_score(brightness=0.6, contrast=0.7)
    assert optimal >= 90.0

    # No image data fallback
    fallback = svc.calculate_thumbnail_score()
    assert fallback == 55.0

    # Extreme values should penalize
    extreme = svc.calculate_thumbnail_score(brightness=0.05, contrast=0.05)
    assert extreme < 50.0


# ── Full VAS Evaluation Endpoint Test ──────────────────────────
def test_vas_eval_endpoint():
    payload = {
        "title": "How to Deploy Sub-12ms FastAPI Models in Production",
        "hook_script": (
            "In this video I am going to show you the exact technique most developers "
            "don't know about for deploying FastAPI models with sub twelve millisecond "
            "latency. What if I told you that ONNX INT8 quantization could cut your "
            "inference time by eighty percent on a single CPU core? Here is why this "
            "matters and how you can implement it step by step today."
        ),
        "thumbnail_brightness": 0.6,
        "thumbnail_contrast": 0.7,
    }
    response = client.post("/api/v1/creator/vas-eval", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "overall_vas" in data
    assert "title_score" in data
    assert "thumbnail_score" in data
    assert "hook_score" in data
    assert "recommendations" in data
    assert "improved_title_ideas" in data

    assert 0 <= data["overall_vas"] <= 100
    assert 0 <= data["title_score"] <= 100
    assert 0 <= data["thumbnail_score"] <= 100
    assert 0 <= data["hook_score"] <= 100
    assert len(data["improved_title_ideas"]) >= 1


# ── DB Persistence Test ────────────────────────────────────────
def test_vas_db_persistence(db):
    req = VASEvalRequestDTO(
        title="Test Title for Persistence",
        hook_script="This is a test hook script for database persistence verification.",
        thumbnail_brightness=0.5,
        thumbnail_contrast=0.6,
    )
    result = PackagingOptimizerService.evaluate(req, db)

    assert result.overall_vas > 0

    saved = db.query(VASEvaluation).filter(VASEvaluation.title == "Test Title for Persistence").first()
    assert saved is not None
    assert saved.overall_vas == result.overall_vas
    assert saved.title_score == result.title_score


# ═══════════════════════════════════════════════════════════════
#  Phase 4 Ticket 02 — Deep Diagnostic Analyzer Tests
# ═══════════════════════════════════════════════════════════════


def test_thumbnail_vision_analyzer():
    svc = PackagingOptimizerService

    # Optimal brightness/contrast should yield high scores
    optimal = svc.analyze_thumbnail_vision(brightness=0.6, contrast=0.7)
    assert optimal.color_balance > 70.0
    assert optimal.saturation_estimate > 60.0
    assert optimal.visual_impact_score > 60.0
    assert optimal.legibility_score > 60.0
    assert optimal.readability_grade in ("EXCELLENT", "GOOD")

    # Poor values should produce lower scores
    poor = svc.analyze_thumbnail_vision(brightness=0.05, contrast=0.1)
    assert poor.visual_impact_score < optimal.visual_impact_score
    assert poor.readability_grade in ("FAIR", "POOR")

    # No-data fallback should produce baseline values
    fallback = svc.analyze_thumbnail_vision()
    assert fallback.brightness is None
    assert fallback.contrast is None
    assert fallback.color_balance > 0


def test_advanced_title_patterns():
    svc = PackagingOptimizerService

    patterns = svc.generate_title_patterns("Deploy FastAPI Models")
    assert len(patterns) == 5

    pattern_types = [p.pattern_type for p in patterns]
    assert "Number Hook" in pattern_types
    assert "Negative Hook" in pattern_types
    assert "Curiosity Gap" in pattern_types
    assert "Comparison Hook" in pattern_types
    assert "How-To Authority" in pattern_types

    # Each suggestion should contain text
    for p in patterns:
        assert len(p.suggested_title) > 10

    # Title analysis should include patterns
    analysis = svc.analyze_title("Deploy FastAPI Models in Production")
    assert analysis.char_count > 0
    assert len(analysis.pattern_suggestions) == 5


def test_hook_retention_analysis():
    svc = PackagingOptimizerService

    # Short hook should have low pacing and retention
    short_hook = "Hello everyone."
    short_result = svc.analyze_hook_retention(short_hook)
    assert short_result.word_count < 10
    assert short_result.word_pacing_score <= 30.0
    assert short_result.estimated_retention_pct < 60.0

    # Rich hook with hook phrases and questions
    rich_hook = (
        "In this video I am going to show you something incredible. "
        "What if I told you that most people never learn this amazing technique? "
        "Imagine deploying your models in under twelve milliseconds. "
        "Here's why nobody talks about this shocking approach. "
        "Don't miss this — subscribe and let me know what you think."
    )
    rich_result = svc.analyze_hook_retention(rich_hook)
    assert rich_result.hook_phrase_count >= 3
    assert rich_result.emotional_arc_score > 50.0
    assert rich_result.call_to_action_presence is True
    assert rich_result.estimated_retention_pct > short_result.estimated_retention_pct


def test_detailed_vas_analysis_endpoint():
    payload = {
        "title": "How to Deploy Sub-12ms FastAPI Models in Production",
        "hook_script": (
            "In this video I am going to show you the exact technique most developers "
            "don't know about for deploying FastAPI models with sub twelve millisecond "
            "latency. What if I told you that ONNX INT8 quantization could cut your "
            "inference time by eighty percent on a single CPU core? Here is why this "
            "matters and how you can implement it step by step today."
        ),
        "thumbnail_brightness": 0.6,
        "thumbnail_contrast": 0.7,
    }
    response = client.post("/api/v1/creator/vas-analysis", json=payload)
    assert response.status_code == 200

    data = response.json()
    # Top-level scores
    assert "overall_vas" in data
    assert 0 <= data["overall_vas"] <= 100

    # Thumbnail analysis
    assert "thumbnail_analysis" in data
    thumb = data["thumbnail_analysis"]
    assert "color_balance" in thumb
    assert "visual_impact_score" in thumb
    assert "legibility_score" in thumb
    assert thumb["readability_grade"] in ("EXCELLENT", "GOOD", "FAIR", "POOR")

    # Title analysis
    assert "title_analysis" in data
    title_a = data["title_analysis"]
    assert title_a["char_count"] > 0
    assert len(title_a["pattern_suggestions"]) == 5

    # Hook analysis
    assert "hook_analysis" in data
    hook_a = data["hook_analysis"]
    assert hook_a["word_count"] > 0
    assert "estimated_retention_pct" in hook_a

    # Pattern-typed improved titles
    assert "improved_title_ideas" in data
    assert len(data["improved_title_ideas"]) == 5
    assert data["improved_title_ideas"][0]["pattern_type"] == "Number Hook"
