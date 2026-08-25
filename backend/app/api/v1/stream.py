from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.db.session import get_db
from app.db.models import RawRecord, RecordType, Job, JobStatus
from app.schemas.stream import (
    StreamTelemetrySchema, StreamScoreResponseDTO,
    BatchStreamTelemetrySchema, BatchStreamResponseDTO
)
from app.services.onnx_embeddings import onnx_scorer
from app.services.broadcaster import broadcaster


router = APIRouter()

@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        await websocket.send_json({"type": "CONNECTED", "message": "WebSocket Broadcaster Hub connected"})
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)

@router.post("/stream", response_model=StreamScoreResponseDTO)
async def sync_stream(payload: StreamTelemetrySchema, db: Session = Depends(get_db)):
    text_to_score = f"{payload.title or ''} {payload.channel_name or ''}".strip()
    if not text_to_score:
        text_to_score = payload.video_id
    
    score_result = onnx_scorer.score(text_to_score, payload.goal_text)
    
    try:
        timestamp_dt = datetime.fromisoformat(payload.timestamp.replace('Z', '+00:00'))
    except ValueError:
        timestamp_dt = datetime.utcnow()
        
    target_job_id = payload.job_id or "stream_job_default"
    job = db.query(Job).filter(Job.id == target_job_id).first()
    if not job:
        job = Job(id=target_job_id, status=JobStatus.PROCESSING, goal_text=payload.goal_text)
        db.add(job)
        db.commit()

    record = RawRecord(
        job_id=target_job_id,
        timestamp=timestamp_dt,
        raw_title=payload.title or payload.video_id,
        title_url=f"https://www.youtube.com/watch?v={payload.video_id}",
        video_id=payload.video_id,
        record_type=RecordType.VIDEO
    )
    db.add(record)
    db.commit()

    # Re-evaluate real-time metrics & goal alignment for target_job_id dynamically
    try:
        from app.services.proxy_metrics import ProxyMetricsEngine
        from app.services.goal_alignment import GoalAlignmentEngine
        ProxyMetricsEngine.compute_job_metrics(db, target_job_id)
        GoalAlignmentEngine.evaluate_job_alignment(db, target_job_id, payload.goal_text)
    except Exception as e:
        pass

    score_dto = StreamScoreResponseDTO(
        video_id=payload.video_id,
        alignment_score=score_result["score"],
        classification=score_result["classification"],
        status="success"
    )
    
    await broadcaster.broadcast_watch_update(payload, score_dto)

    # Re-evaluate velocity analytics and broadcast VELOCITY_UPDATE over WebSocket
    try:
        from app.services.velocity_engine import VelocityEngine
        vel_analytics = VelocityEngine.calculate_velocity(db, target_job_id)
        await broadcaster.broadcast_velocity_update(target_job_id, vel_analytics)
    except Exception as e:
        pass

    return score_dto

@router.post("/stream/batch", response_model=BatchStreamResponseDTO)
async def sync_stream_batch(payload: BatchStreamTelemetrySchema, db: Session = Depends(get_db)):
    """
    Ingests a batch of recent watch history items (e.g. from Chrome history 1-click backfill)
    and computes baseline metrics instantly.
    """
    target_job_id = payload.job_id or "stream_job_default"
    goal_text = payload.goal_text or "Software Engineering, Programming, Machine Learning"
    
    job = db.query(Job).filter(Job.id == target_job_id).first()
    if not job:
        job = Job(id=target_job_id, status=JobStatus.COMPLETED, goal_text=goal_text)
        db.add(job)
        db.commit()
    else:
        job.goal_text = goal_text
        db.commit()

    ingested = 0
    for item in payload.items:
        if not item.video_id:
            continue
        try:
            timestamp_dt = datetime.fromisoformat(item.timestamp.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            timestamp_dt = datetime.utcnow()

        record = RawRecord(
            job_id=target_job_id,
            timestamp=timestamp_dt,
            raw_title=item.title or item.video_id,
            title_url=f"https://www.youtube.com/watch?v={item.video_id}",
            video_id=item.video_id,
            record_type=RecordType.VIDEO
        )
        db.add(record)
        ingested += 1

    try:
        db.commit()
    except Exception:
        db.rollback()

    # Re-evaluate real-time metrics & goal alignment
    try:
        from app.services.proxy_metrics import ProxyMetricsEngine
        from app.services.goal_alignment import GoalAlignmentEngine, RecommendationEngine
        from app.services.dag_engine import DAGEngine

        ProxyMetricsEngine.compute_job_metrics(db, target_job_id)
        GoalAlignmentEngine.evaluate_job_alignment(db, target_job_id, goal_text)
        RecommendationEngine.generate_and_save_recommendations(db, target_job_id, goal_text)
        DAGEngine.build_dag_for_job(db, target_job_id)
    except Exception:
        pass

    return BatchStreamResponseDTO(
        status="success",
        ingested_count=ingested,
        job_id=target_job_id,
        message=f"Successfully backfilled and analyzed {ingested} watch history items."
    )


