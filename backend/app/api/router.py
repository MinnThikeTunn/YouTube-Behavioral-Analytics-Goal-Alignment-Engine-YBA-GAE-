from fastapi import APIRouter
from app.api.v1 import upload, jobs, analytics

api_router = APIRouter()
api_router.include_router(upload.router, tags=["upload"])
api_router.include_router(jobs.router, tags=["jobs"])
api_router.include_router(analytics.router, tags=["analytics"])
