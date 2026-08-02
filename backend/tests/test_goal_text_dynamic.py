import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Job
from app.api.v1.analytics import get_analytics_results

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_analytics_result_returns_dynamic_goal_text(db_session):
    job = Job(id="job_ai_1", goal_text="AI and data science", status="COMPLETED")
    db_session.add(job)
    db_session.commit()

    res = get_analytics_results("job_ai_1", db=db_session)
    assert res.goal_text == "AI and data science"
