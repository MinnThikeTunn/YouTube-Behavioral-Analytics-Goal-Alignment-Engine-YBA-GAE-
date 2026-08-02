import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Job, RawRecord, RecordType, EnrichedVideo, EnrichedChannel, RecommendedChannel
from app.services.goal_alignment import GoalAlignmentEngine, RecommendationEngine

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_watched_channel_recommendation_filtering(db_session):
    job = Job(id="job_test_1", goal_text="Software Engineering", status="COMPLETED")
    db_session.add(job)

    now = datetime.utcnow()

    # 1. Aligned channel with software engineering video titles
    ch_aligned = EnrichedChannel(channel_id="UC_aligned", channel_title="Tech Academy", channel_description="Programming tutorials")
    vid_aligned = EnrichedVideo(video_id="v_1", channel_id="UC_aligned", video_title="Software Engineering Principles and Clean Code")
    rec_aligned = RawRecord(job_id="job_test_1", timestamp=now, record_type=RecordType.VIDEO, video_id="v_1", raw_title="Watched Software Engineering Principles and Clean Code")

    # 2. Unaligned channels (sports/gaming)
    ch_unaligned1 = EnrichedChannel(channel_id="UC_sports", channel_title="ІФ СПОРТ", channel_description="Sports news")
    vid_unaligned1 = EnrichedVideo(video_id="v_2", channel_id="UC_sports", video_title="Football match highlights")
    rec_unaligned1 = RawRecord(job_id="job_test_1", timestamp=now, record_type=RecordType.VIDEO, video_id="v_2", raw_title="Watched Football match highlights")

    ch_unaligned2 = EnrichedChannel(channel_id="UC_gaming", channel_title="Footchunks", channel_description="Gaming clips")
    vid_unaligned2 = EnrichedVideo(video_id="v_3", channel_id="UC_gaming", video_title="Best gaming moments")
    rec_unaligned2 = RawRecord(job_id="job_test_1", timestamp=now, record_type=RecordType.VIDEO, video_id="v_3", raw_title="Watched Best gaming moments")

    db_session.add_all([ch_aligned, vid_aligned, rec_aligned, ch_unaligned1, vid_unaligned1, rec_unaligned1, ch_unaligned2, vid_unaligned2, rec_unaligned2])
    db_session.commit()

    _, watched_recs = GoalAlignmentEngine.evaluate_job_alignment(db_session, "job_test_1", "Software Engineering")

    # Filtered watched recommendations should ONLY contain channels with similarity > 0 (or >= threshold)
    # 0% match channels (like ІФ СПОРТ or Footchunks) must NOT be recommended!
    recommended_channel_ids = [r["channel_id"] for r in watched_recs if r["similarity_score"] > 0]
    assert "UC_aligned" in recommended_channel_ids, "Tech Academy should be recommended"
    assert "UC_sports" not in recommended_channel_ids, "Sports channel with 0% similarity must be filtered out"
    assert "UC_gaming" not in recommended_channel_ids, "Gaming channel with 0% similarity must be filtered out"
    
    for r in watched_recs:
        assert r["similarity_score"] > 0, f"Channel {r['channel_title']} has 0 similarity score and should be filtered out!"

def test_gemini_discovery_channel_models():
    discovery_items = RecommendationEngine.fetch_gemini_discovery_channels("Software Engineering")
    assert len(discovery_items) >= 3, "Discovery recommendations must return at least 3 channels"
    for item in discovery_items:
        assert "channel_title" in item
        assert "channel_url" in item
        assert item.get("similarity_score", 0) > 0.5
