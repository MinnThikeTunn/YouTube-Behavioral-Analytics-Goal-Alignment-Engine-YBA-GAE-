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

def test_update_job_goal_endpoint(db_session):
    from app.api.v1.jobs import update_job_goal
    from app.schemas.job import GoalUpdateDTO

    job = Job(id="job_update_1", goal_text="Old Goal", status="COMPLETED")
    db_session.add(job)
    db_session.commit()

    res = update_job_goal("job_update_1", GoalUpdateDTO(goal_text="Updated Goal Text"), db=db_session)
    assert res["status"] == "success"
    assert res["goal_text"] == "Updated Goal Text"

    updated_job = db_session.query(Job).filter(Job.id == "job_update_1").first()
    assert updated_job.goal_text == "Updated Goal Text"

