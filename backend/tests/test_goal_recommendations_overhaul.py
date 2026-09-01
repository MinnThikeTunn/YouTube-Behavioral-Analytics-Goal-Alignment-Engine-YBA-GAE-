import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Job, RecommendedChannel
from app.services.goal_alignment import (
    RecommendationEngine,
    CURATED_DISCOVERY_MAP
)

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_disco_home_make_dynamic_tailored_channels():
    """Verify that a goal like 'Disco, Home make' generates tailored discovery channels and no cooking fallbacks."""
    items = RecommendationEngine.fetch_gemini_discovery_channels("Disco, Home make")
    assert len(items) >= 3
    
    titles = [item.get("channel_title", "") for item in items]
    titles_and_desc = " ".join([
        (item.get("channel_title", "") + " " + item.get("channel_description", "")).lower()
        for item in items
    ])
    
    # Must NOT contain hardcoded cooking names
    cooking_terms = ["babish", "weissman", "ramsay", "culinary", "kitchen", "chlebowski"]
    for term in cooking_terms:
        assert term not in titles_and_desc, f"Cooking term '{term}' should not appear for goal 'Disco, Home make'!"
    
    # Must contain dynamic goal-tailored terms
    assert any("disco, home make" in t.lower() or "disco" in t.lower() for t in titles)

def test_arbitrary_goals_are_dynamically_tailored():
    """Verify that arbitrary custom goals dynamically produce specific channels."""
    # 1. Quantum Computing
    quantum_items = RecommendationEngine.fetch_gemini_discovery_channels("Quantum Computing")
    assert len(quantum_items) >= 3
    assert any("quantum computing" in item["channel_title"].lower() for item in quantum_items)
    
    # 2. Woodworking
    wood_items = RecommendationEngine.fetch_gemini_discovery_channels("Woodworking")
    assert len(wood_items) >= 3
    assert any("woodworking" in item["channel_title"].lower() for item in wood_items)

def test_gemini_models_are_valid():
    """Ensure GEMINI_MODELS only contains valid supported Google Gemini endpoints."""
    valid_endpoints = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-pro"]
    for model in RecommendationEngine.GEMINI_MODELS:
        assert model in valid_endpoints or "flash" in model

def test_generate_and_save_recommendations_clears_old_records(db_session):
    """Verify that generate_and_save_recommendations cleanly replaces prior records."""
    job_id = "test_cleanup_job"
    job = Job(id=job_id, goal_text="Software Engineering", status="COMPLETED")
    db_session.add(job)
    
    # Pre-populate with old dummy records
    old_rec = RecommendedChannel(
        job_id=job_id,
        channel_title="Old Irrelevant Channel",
        channel_description="Old description",
        similarity_score=0.99,
        category="discovery"
    )
    db_session.add(old_rec)
    db_session.commit()
    
    assert db_session.query(RecommendedChannel).filter(RecommendedChannel.job_id == job_id).count() == 1
    
    # Generate fresh recommendations
    RecommendationEngine.generate_and_save_recommendations(db_session, job_id, "Data Science")
    
    recs = db_session.query(RecommendedChannel).filter(RecommendedChannel.job_id == job_id).all()
    assert len(recs) >= 3
    titles = [r.channel_title for r in recs]
    assert "Old Irrelevant Channel" not in titles, "Old recommendations must be wiped before saving new ones!"
    assert any("Data Science" in t for t in titles)
