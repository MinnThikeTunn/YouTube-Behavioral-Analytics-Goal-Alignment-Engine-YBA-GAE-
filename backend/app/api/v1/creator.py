from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.creator import CommentMiningRequestDTO, CommentMiningResponseDTO, MinedCommentDTO
from app.schemas.trend import NicheTrendRadarResponseDTO
from app.schemas.opportunity import ContentGapMatrixResponseDTO
from app.schemas.vas import VASEvalRequestDTO, VASEvalResponseDTO, DetailedVASAnalysisDTO
from app.services.comment_miner import CommentMinerService
from app.services.trend_radar import TrendRadarEngine
from app.services.opportunity_engine import OpportunityEngine
from app.services.packaging_optimizer import PackagingOptimizerService
from app.db.models import MinedComment

router = APIRouter()


@router.post("/vas-eval", response_model=VASEvalResponseDTO)
def evaluate_video_packaging(request: VASEvalRequestDTO, db: Session = Depends(get_db)):
    """Pre-publish Viewer Attraction Score (VAS) evaluation endpoint."""
    return PackagingOptimizerService.evaluate(request, db)


@router.post("/vas-analysis", response_model=DetailedVASAnalysisDTO)
def detailed_vas_analysis(request: VASEvalRequestDTO):
    """Deep diagnostic analysis of title, thumbnail vision, and hook retention."""
    return PackagingOptimizerService.detailed_analysis(request)


@router.get("/trends", response_model=NicheTrendRadarResponseDTO)
def get_niche_trends():
    engine = TrendRadarEngine()
    mock_data = [
        {
            "niche_name": "AI Coding Assistants",
            "delta_views": 0.9,
            "delta_uploads": 0.7,
            "sentiment_ratio": 0.8,
            "keyword_clusters": ["agents", "copilot", "automation"]
        },
        {
            "niche_name": "Web3 Gaming",
            "delta_views": -0.1,
            "delta_uploads": -0.3,
            "sentiment_ratio": 0.4,
            "keyword_clusters": ["nft", "play-to-earn"]
        },
        {
            "niche_name": "Productivity Hacks",
            "delta_views": 0.4,
            "delta_uploads": 0.5,
            "sentiment_ratio": 0.6,
            "keyword_clusters": ["notion", "time-blocking", "focus"]
        }
    ]
    return engine.analyze_trends(mock_data)

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
    engine = OpportunityEngine()
    mock_data = [
        {
            "topic": "Building AI Agents",
            "demand_index": 8.5,
            "competitor_density": 0.4,
            "recommended_titles": ["How to Build AI Agents from Scratch", "AI Agents for Beginners"]
        },
        {
            "topic": "Next.js 14 Tutorial",
            "demand_index": 9.0,
            "competitor_density": 1.2,
            "recommended_titles": ["Next.js 14 Crash Course", "Mastering Next.js 14"]
        },
        {
            "topic": "Rust for Web Developers",
            "demand_index": 6.0,
            "competitor_density": 0.2,
            "recommended_titles": ["Why Web Developers Should Learn Rust", "Rust Web Development"]
        }
    ]
    return engine.analyze_opportunities(mock_data)
