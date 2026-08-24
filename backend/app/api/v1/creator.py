from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.creator import (
    CommentMiningRequestDTO, CommentMiningResponseDTO, MinedCommentDTO,
    ChannelIntentDistributionDTO
)
from app.schemas.trend import NicheTrendRadarResponseDTO
from app.schemas.opportunity import ContentGapMatrixResponseDTO
from app.schemas.vas import (
    VASEvalRequestDTO, VASEvalResponseDTO, DetailedVASAnalysisDTO, ClosedLoopResponseDTO,
    ThumbnailVisionResultDTO, Composite8FactorScoreDTO, ClosedLoopSyncRequestDTO, ClosedLoopTelemetryResultDTO
)
from app.services.comment_miner import CommentMinerService
from app.services.trend_radar import TrendRadarEngine
from app.services.opportunity_engine import OpportunityEngine
from app.services.packaging_optimizer import PackagingOptimizerService
from app.db.models import MinedComment

router = APIRouter()


@router.post("/thumbnail-analyze", response_model=ThumbnailVisionResultDTO)
async def analyze_thumbnail(file: UploadFile = File(...)):
    """Extract computer vision statistics from uploaded thumbnail image."""
    contents = await file.read()
    try:
        return PackagingOptimizerService.analyze_thumbnail_image(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/channel-intent-distribution", response_model=ChannelIntentDistributionDTO)
def get_channel_intent_distribution(
    channel_handle: Optional[str] = Query(None, description="Optional YouTube channel handle or ID"),
    db: Session = Depends(get_db)
):
    """Aggregate channel-wide audience intent distribution and topic heatmap."""
    miner = CommentMinerService(db)
    return miner.get_channel_intent_distribution(channel_handle=channel_handle)



@router.post("/composite-score", response_model=Composite8FactorScoreDTO)
def compute_composite_score(request: VASEvalRequestDTO, db: Session = Depends(get_db)):
    """Generate 8-factor composite spider score breakdown for video packaging and market fit."""
    return PackagingOptimizerService.compute_composite_score(request, db)


@router.post("/closed-loop/sync", response_model=ClosedLoopTelemetryResultDTO)
def sync_closed_loop_telemetry(request: ClosedLoopSyncRequestDTO, db: Session = Depends(get_db)):
    """Sync actual post-publish metrics and trigger closed-loop weight auto-tuning."""
    return PackagingOptimizerService.sync_telemetry_and_autotune(request, db)


@router.post("/vas-eval", response_model=VASEvalResponseDTO)
def evaluate_video_packaging(request: VASEvalRequestDTO, db: Session = Depends(get_db)):
    """Pre-publish Viewer Attraction Score (VAS) evaluation endpoint."""
    return PackagingOptimizerService.evaluate(request, db)


@router.post("/vas-analysis", response_model=DetailedVASAnalysisDTO)
def detailed_vas_analysis(request: VASEvalRequestDTO):
    """Deep diagnostic analysis of title, thumbnail vision, and hook retention."""
    return PackagingOptimizerService.detailed_analysis(request)


@router.get("/closed-loop", response_model=ClosedLoopResponseDTO)
def get_closed_loop_telemetry(db: Session = Depends(get_db)):
    """Closed-loop feedback tracker correlating post-publish performance with VAS predictions."""
    return PackagingOptimizerService.get_closed_loop_telemetry(db)




@router.get("/trends", response_model=NicheTrendRadarResponseDTO)
def get_niche_trends():
    """Discover real-time trending topics and trajectory velocities via dynamic search."""
    engine = TrendRadarEngine()
    return engine.fetch_dynamic_niche_trends()

@router.post("/comments", response_model=CommentMiningResponseDTO)
def mine_video_comments(request: CommentMiningRequestDTO, db: Session = Depends(get_db)):
    miner = CommentMinerService(db)
    try:
        comments = miner.mine_comments(request.video_id, request.max_results)
        
        comment_dtos = []
        for c in comments:
            comment_dtos.append(MinedCommentDTO.model_validate(c))
            
        return CommentMiningResponseDTO(
            video_id=request.video_id,
            total_mined=len(comment_dtos),
            comments=comment_dtos
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/comments/{video_id}", response_model=CommentMiningResponseDTO)
def get_video_comments(video_id: str, max_results: int = Query(100), db: Session = Depends(get_db)):
    comments = db.query(MinedComment).filter(MinedComment.video_id == video_id).limit(max_results).all()
    
    comment_dtos = []
    for c in comments:
        comment_dtos.append(MinedCommentDTO.model_validate(c))
        
    return CommentMiningResponseDTO(
        video_id=video_id,
        total_mined=len(comment_dtos),
        comments=comment_dtos
    )

@router.get("/opportunity", response_model=ContentGapMatrixResponseDTO)
def get_video_opportunities():
    """Calculate dynamic opportunity matrix and AI title recommendations aligned with user goals."""
    engine = OpportunityEngine()
    return engine.fetch_dynamic_opportunities()

