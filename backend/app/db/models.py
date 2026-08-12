import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship, backref
from app.db.session import Base

class JobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    QUOTA_PAUSED = "QUOTA_PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class RecordType(str, enum.Enum):
    VIDEO = "VIDEO"
    COMMUNITY_POST = "COMMUNITY_POST"
    AD = "AD"
    NON_VIEWING_ACTIVITY = "NON_VIEWING_ACTIVITY"
    INACCESSIBLE_VIDEO = "INACCESSIBLE_VIDEO"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED, nullable=False)
    total_records = Column(Integer, default=0)
    video_records = Column(Integer, default=0)
    community_post_records = Column(Integer, default=0)
    ad_records = Column(Integer, default=0)
    non_viewing_records = Column(Integer, default=0)
    goal_text = Column(Text, nullable=False)
    user_api_key = Column(String, nullable=True)
    progress_pct = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    raw_records = relationship("RawRecord", back_populates="job", cascade="all, delete-orphan")
    computed_metrics = relationship("ComputedMetric", back_populates="job", uselist=False, cascade="all, delete-orphan")
    alignment_score = relationship("GoalAlignmentScore", back_populates="job", uselist=False, cascade="all, delete-orphan")
    recommended_channels = relationship("RecommendedChannel", back_populates="job", cascade="all, delete-orphan")
    logs = relationship("JobLog", back_populates="job", cascade="all, delete-orphan", order_by="JobLog.timestamp.asc()")
    dag_nodes = relationship("DAGNode", back_populates="job", cascade="all, delete-orphan")

class RawRecord(Base):
    __tablename__ = "raw_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    raw_title = Column(Text, nullable=False)
    title_url = Column(Text, nullable=True)
    video_id = Column(String, nullable=True, index=True)
    record_type = Column(Enum(RecordType), default=RecordType.VIDEO, nullable=False)

    job = relationship("Job", back_populates="raw_records")

class EnrichedVideo(Base):
    __tablename__ = "enriched_videos"

    video_id = Column(String, primary_key=True, index=True)
    channel_id = Column(String, ForeignKey("enriched_channels.channel_id"), nullable=True, index=True)
    video_title = Column(Text, nullable=True)
    video_description = Column(Text, nullable=True)
    tags_json = Column(Text, nullable=True)
    category_id = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    topic_categories_json = Column(Text, nullable=True)
    cached_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("EnrichedChannel", back_populates="videos")

class EnrichedChannel(Base):
    __tablename__ = "enriched_channels"

    channel_id = Column(String, primary_key=True, index=True)
    channel_title = Column(Text, nullable=True)
    channel_description = Column(Text, nullable=True)
    topic_categories_json = Column(Text, nullable=True)
    cached_at = Column(DateTime, default=datetime.utcnow)

    videos = relationship("EnrichedVideo", back_populates="channel")

class ComputedMetric(Base):
    __tablename__ = "computed_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, unique=True, index=True)
    focus_ratio = Column(Float, default=0.0)
    median_completion_prob = Column(Float, default=0.0)
    session_density = Column(Float, default=0.0)
    circadian_score = Column(Float, default=0.0)
    window_period = Column(String, default="all_time")
    calculated_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="computed_metrics")

class GoalAlignmentScore(Base):
    __tablename__ = "goal_alignment_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, unique=True, index=True)
    alignment_probability_score = Column(Float, default=0.0)
    focus_ratio_weight = Column(Float, default=0.30)
    completion_weight = Column(Float, default=0.50)
    session_density_penalty = Column(Float, default=0.10)
    circadian_penalty = Column(Float, default=0.10)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="alignment_score")

class RecommendedChannel(Base):
    __tablename__ = "recommended_channels"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    channel_id = Column(String, nullable=True)
    channel_title = Column(Text, nullable=False)
    channel_description = Column(Text, nullable=True)
    similarity_score = Column(Float, default=0.0)
    category = Column(String, default="watched") # "watched" or "discovery"
    channel_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="recommended_channels")

class JobLog(Base):
    __tablename__ = "job_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    stage = Column(String, nullable=False)  # "INGESTION", "ENRICHMENT", "METRICS", "AI_DISCOVERY"
    level = Column(String, default="INFO")   # "INFO", "CALCULATION", "SUCCESS", "WARNING", "ERROR"
    message = Column(Text, nullable=False)
    details_json = Column(Text, nullable=True)

    job = relationship("Job", back_populates="logs")

class DAGNode(Base):
    __tablename__ = "dag_nodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("dag_nodes.id"), nullable=True, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Integer, default=0)
    progress_pct = Column(Float, default=0.0)
    embedding_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="dag_nodes")
    children = relationship("DAGNode", backref=backref("parent", remote_side=[id]))

class CommentIntent(str, enum.Enum):
    REQUEST = "REQUEST"
    CONFUSION = "CONFUSION"
    PRAISE = "PRAISE"
    DEBATE = "DEBATE"

class MinedComment(Base):
    __tablename__ = "mined_comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String, index=True, nullable=False)
    comment_id = Column(String, unique=True, index=True, nullable=False)
    author_name = Column(String, nullable=True)
    text_display = Column(Text, nullable=False)
    like_count = Column(Integer, default=0)
    published_at = Column(DateTime, nullable=True)
    intent_label = Column(Enum(CommentIntent), nullable=True)
    sentiment_score = Column(Float, nullable=True)
    cached_at = Column(DateTime, default=datetime.utcnow)


class VASEvaluation(Base):
    __tablename__ = "vas_evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    hook_script = Column(Text, nullable=False)
    title_score = Column(Float, nullable=False)
    thumbnail_score = Column(Float, nullable=False)
    hook_score = Column(Float, nullable=False)
    overall_vas = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
