from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.db.session import get_db
from app.db.models import RawRecord, RecordType, Job, JobStatus
from app.schemas.stream import StreamTelemetrySchema, StreamScoreResponseDTO
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
        
    job_id = "stream_job_default"
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        job = Job(id=job_id, status=JobStatus.PROCESSING, goal_text=payload.goal_text)
        db.add(job)
        db.commit()

    record = RawRecord(
        job_id=job_id,
        timestamp=timestamp_dt,
        raw_title=payload.title or payload.video_id,
        title_url=f"https://www.youtube.com/watch?v={payload.video_id}",
        video_id=payload.video_id,
        record_type=RecordType.VIDEO
    )
    db.add(record)
    db.commit()
    
    score_dto = StreamScoreResponseDTO(
        video_id=payload.video_id,
        alignment_score=score_result["score"],
        classification=score_result["classification"],
        status="success"
    )
    
    await broadcaster.broadcast_watch_update(payload, score_dto)
    
    return score_dto
