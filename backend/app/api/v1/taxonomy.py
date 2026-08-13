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
        DAGEngine.build_dag_for_job(db, request.job_id)
        nodes = DAGEngine.get_dag(db, request.job_id)
        return DAGTreeResponseDTO(job_id=request.job_id, nodes=_build_tree(nodes))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{job_id}", response_model=DAGTreeResponseDTO)
@router.get("/dag/{job_id}", response_model=DAGTreeResponseDTO)
def get_dag(job_id: str, db: Session = Depends(get_db)):
    nodes = DAGEngine.get_dag(db, job_id)
    if not nodes:
        return DAGTreeResponseDTO(job_id=job_id, nodes=[])
    return DAGTreeResponseDTO(job_id=job_id, nodes=_build_tree(nodes))

