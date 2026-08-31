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

    async def broadcast_alignment_update(self, job_id: str, score_orm: Any, metrics_orm: Any = None):
        score_data = None
        if score_orm is not None:
            score_data = {
                "alignment_probability_score": getattr(score_orm, "alignment_probability_score", 0.0),
                "focus_ratio_weight": getattr(score_orm, "focus_ratio_weight", 0.40),
                "completion_weight": getattr(score_orm, "completion_weight", 0.60),
                "session_density_penalty": getattr(score_orm, "session_density_penalty", 0.0),
                "circadian_penalty": getattr(score_orm, "circadian_penalty", 0.0),
            }

        metrics_data = None
        if metrics_orm is not None:
            metrics_data = {
                "focus_ratio": getattr(metrics_orm, "focus_ratio", 0.0),
                "median_completion_prob": getattr(metrics_orm, "median_completion_prob", 0.0),
                "session_density": getattr(metrics_orm, "session_density", 0.0),
                "circadian_score": getattr(metrics_orm, "circadian_score", 0.0),
                "window_period": getattr(metrics_orm, "window_period", "all_time"),
            }

        message = {
            "type": "ALIGNMENT_UPDATE",
            "data": {
                "job_id": job_id,
                "alignment_score": score_data,
                "metrics": metrics_data
            }
        }
        await self.broadcast(json.dumps(message, default=str))

broadcaster = BroadcasterManager()
