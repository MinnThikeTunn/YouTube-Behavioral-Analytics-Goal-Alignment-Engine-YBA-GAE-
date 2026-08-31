from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.taxonomy import DAGBuildRequestDTO, DAGTreeResponseDTO, DAGNodeDTO
from app.services.dag_engine import DAGEngine

router = APIRouter()

def _build_tree(nodes):
    return [DAGNodeDTO.model_validate(n) for n in nodes if n.parent_id is None]


@router.post("", response_model=DAGTreeResponseDTO)
@router.post("/", response_model=DAGTreeResponseDTO)
@router.post("/dag", response_model=DAGTreeResponseDTO)
def build_dag(request: DAGBuildRequestDTO, db: Session = Depends(get_db)):
    try:
        from app.db.models import Job
        job = db.query(Job).filter(Job.id == request.job_id).first()
        user_key = job.user_api_key if job else None
        DAGEngine.build_dag_for_job(db, request.job_id, user_api_key=user_key)
        nodes = DAGEngine.get_dag(db, request.job_id)
        return DAGTreeResponseDTO(job_id=request.job_id, nodes=_build_tree(nodes))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{job_id}", response_model=DAGTreeResponseDTO)
@router.get("/dag/{job_id}", response_model=DAGTreeResponseDTO)
def get_dag(job_id: str, db: Session = Depends(get_db)):
    from app.db.models import Job
    nodes = DAGEngine.get_dag(db, job_id)
    
    needs_rebuild = not nodes
    if nodes and not needs_rebuild:
        legacy_signatures = ["Core Principles & Theory", "Practical Execution & Projects", "Mastery & Optimization"]
        if any(any(sig in (n.title or "") for sig in legacy_signatures) for n in nodes):
            needs_rebuild = True

    if needs_rebuild:
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            user_key = job.user_api_key if job else None
            DAGEngine.build_dag_for_job(db, job_id, user_api_key=user_key)
            nodes = DAGEngine.get_dag(db, job_id)
        except Exception:
            if not nodes:
                nodes = []
    return DAGTreeResponseDTO(job_id=job_id, nodes=_build_tree(nodes))

