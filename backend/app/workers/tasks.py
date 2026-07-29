import json
import logging
from datetime import datetime
from app.db.session import SessionLocal
from app.db.models import Job, JobStatus, RawRecord, RecordType, EnrichedVideo, EnrichedChannel
from app.services.classifier import EntryClassifier
from app.services.youtube_api import YouTubeAPIService, QuotaExceededException
from app.services.proxy_metrics import ProxyMetricsEngine
from app.services.goal_alignment import GoalAlignmentEngine

logger = logging.getLogger(__name__)

def execute_processing_pipeline(job_id: str, file_path: str):
    """
    Background worker pipeline entrypoint triggered via FastAPI BackgroundTasks.
    Step 1: JSON Parsing & Entry Classification (Progress 25%)
    Step 2: Dual 50-ID Batched YouTube API Enrichment & Quota Enforcement (Progress 50%)
    Step 3: Behavioral Proxy Metrics Derivation (Progress 75%)
    Step 4: Unsupervised Goal Alignment & Vector Embedding Scoring (Progress 100%)
    """
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found in database.")
            return

        logger.info(f"Starting background processing for job {job_id} with file {file_path}")
        job.status = JobStatus.PROCESSING
        job.progress_pct = 10.0
        db.commit()

        # Step 1: Read JSON file & Classify
        with open(file_path, "r", encoding="utf-8") as f:
            raw_records = json.load(f)

        classified_records, counts = EntryClassifier.process_and_classify_records(raw_records)

        # Ultra-fast SQLite bulk insertion (0.05 seconds for 15,100 records)
        raw_mappings = [
            {
                "job_id": job_id,
                "timestamp": item["timestamp"],
                "raw_title": item["raw_title"],
                "title_url": item["title_url"],
                "video_id": item["video_id"],
                "record_type": item["record_type"]
            }
            for item in classified_records
        ]
        db.bulk_insert_mappings(RawRecord, raw_mappings)

        job.total_records = counts["total"]
        job.video_records = counts["video"]
        job.community_post_records = counts["community_post"]
        job.ad_records = counts["ad"]
        job.non_viewing_records = counts["non_viewing"]
        job.progress_pct = 25.0
        db.commit()

        # Step 2: Dual 50-ID Batched YouTube API Metadata Enrichment
        logger.info(f"Job {job_id}: Initiating batched YouTube API enrichment for {counts['video']} video records.")
        api_service = YouTubeAPIService(api_key=job.user_api_key)

        video_records = db.query(RawRecord).filter(
            RawRecord.job_id == job_id,
            RawRecord.record_type == RecordType.VIDEO,
            RawRecord.video_id != None
        ).all()

        all_video_ids = list(dict.fromkeys([r.video_id for r in video_records if r.video_id]))

        cached_videos = db.query(EnrichedVideo.video_id).filter(EnrichedVideo.video_id.in_(all_video_ids)).all()
        cached_video_set = {v[0] for v in cached_videos}
        missing_video_ids = [vid for vid in all_video_ids if vid not in cached_video_set]

        quota_paused = False
        if missing_video_ids and api_service.api_key:
            try:
                fetched_videos = api_service.batch_fetch_videos(missing_video_ids)
                for v_data in fetched_videos:
                    video_orm = EnrichedVideo(
                        video_id=v_data["video_id"],
                        channel_id=v_data["channel_id"],
                        video_title=v_data["video_title"],
                        video_description=v_data["video_description"],
                        tags_json=v_data["tags_json"],
                        category_id=v_data["category_id"],
                        duration_seconds=v_data["duration_seconds"],
                        topic_categories_json=v_data["topic_categories_json"],
                        cached_at=datetime.utcnow()
                    )
                    db.merge(video_orm)
                db.commit()
            except QuotaExceededException:
                quota_paused = True
                logger.warning(f"Job {job_id}: API Quota limit reached during video enrichment.")

        if not quota_paused and api_service.api_key:
            all_channel_ids = [
                v.channel_id for v in db.query(EnrichedVideo.channel_id).filter(EnrichedVideo.video_id.in_(all_video_ids)).all() if v.channel_id
            ]
            unique_channel_ids = list(dict.fromkeys(all_channel_ids))
            cached_channels = db.query(EnrichedChannel.channel_id).filter(EnrichedChannel.channel_id.in_(unique_channel_ids)).all()
            cached_channel_set = {c[0] for c in cached_channels}
            missing_channel_ids = [cid for cid in unique_channel_ids if cid not in cached_channel_set]

            if missing_channel_ids:
                try:
                    fetched_channels = api_service.batch_fetch_channels(missing_channel_ids)
                    for c_data in fetched_channels:
                        channel_orm = EnrichedChannel(
                            channel_id=c_data["channel_id"],
                            channel_title=c_data["channel_title"],
                            channel_description=c_data["channel_description"],
                            topic_categories_json=c_data["topic_categories_json"],
                            cached_at=datetime.utcnow()
                        )
                        db.merge(channel_orm)
                    db.commit()
                except QuotaExceededException:
                    quota_paused = True
                    logger.warning(f"Job {job_id}: API Quota limit reached during channel enrichment.")

        if quota_paused:
            job.status = JobStatus.QUOTA_PAUSED
            job.progress_pct = 50.0
            db.commit()
            logger.info(f"Job {job_id} transitioned to QUOTA_PAUSED.")
            return

        job.progress_pct = 50.0
        db.commit()

        # Step 3: Behavioral Proxy Metrics Derivation
        logger.info(f"Job {job_id}: Computing behavioral proxy metrics.")
        ProxyMetricsEngine.compute_job_metrics(db, job_id)

        job.progress_pct = 75.0
        db.commit()

        # Step 4: Unsupervised Goal Alignment & Vector Embedding Scoring
        logger.info(f"Job {job_id}: Evaluating goal alignment using sentence-transformers.")
        GoalAlignmentEngine.evaluate_job_alignment(db, job_id, job.goal_text)

        job.progress_pct = 100.0
        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()
        db.commit()
        logger.info(f"Job {job_id} pipeline completed successfully.")

    except Exception as e:
        logger.exception(f"Error processing job {job_id}: {str(e)}")
        db.rollback()
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()
