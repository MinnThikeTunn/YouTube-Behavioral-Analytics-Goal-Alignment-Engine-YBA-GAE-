from fastapi import APIRouter
from app.api.v1 import jobs, analytics, stream, taxonomy, creator

api_router = APIRouter()
api_router.include_router(jobs.router, tags=["jobs"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(stream.router, prefix="/sync", tags=["stream"])
api_router.include_router(taxonomy.router, prefix="/taxonomy", tags=["taxonomy"])
api_router.include_router(creator.router, prefix="/creator", tags=["creator"])

