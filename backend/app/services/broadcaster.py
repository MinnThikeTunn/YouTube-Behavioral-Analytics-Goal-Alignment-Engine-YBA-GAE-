import json
import logging
from typing import List, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class BroadcasterManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")

    async def broadcast_watch_update(self, payload: Any, score_dto: Any):
        message = {
            "type": "WATCH_UPDATE",
            "data": {
                "video_id": payload.video_id,
                "title": payload.title,
                "channel_name": payload.channel_name,
                "alignment_score": score_dto.alignment_score,
                "classification": score_dto.classification,
                "timestamp": payload.timestamp
            }
        }
        await self.broadcast(json.dumps(message))

    async def broadcast_velocity_update(self, job_id: str, velocity_dto: Any):
        message = {
            "type": "VELOCITY_UPDATE",
            "data": {
                "job_id": job_id,
                "overall_v_cog": velocity_dto.overall_v_cog,
                "sessions": [s.model_dump() if hasattr(s, 'model_dump') else (s.dict() if hasattr(s, 'dict') else s) for s in velocity_dto.sessions],
                "fatigue_windows": [w.model_dump() if hasattr(w, 'model_dump') else (w.dict() if hasattr(w, 'dict') else w) for w in velocity_dto.fatigue_windows]
            }
        }
        await self.broadcast(json.dumps(message, default=str))

broadcaster = BroadcasterManager()
