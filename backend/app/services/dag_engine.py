from sqlalchemy.orm import Session
from app.db.models import Job, DAGNode
import json

class DAGEngine:
    @staticmethod
    def build_dag_for_job(db: Session, job_id: str):
        # Clear existing
        db.query(DAGNode).filter(DAGNode.job_id == job_id).delete()
        
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found")
        
        goal_text = job.goal_text or "Default Goal"
        
        root = DAGNode(
            job_id=job_id,
            title=f"Master Goal: {goal_text}",
            description="Root of the taxonomy",
            is_completed=0,
            progress_pct=0.0
        )
        db.add(root)
        db.commit()
        db.refresh(root)
        
        child1 = DAGNode(
            job_id=job_id,
            parent_id=root.id,
            title="Sub-Goal 1",
            description="First step",
            is_completed=1,
            progress_pct=100.0,
            embedding_json=json.dumps([0.1, 0.2, 0.3])
        )
        child2 = DAGNode(
            job_id=job_id,
            parent_id=root.id,
            title="Sub-Goal 2",
            description="Second step",
            is_completed=0,
            progress_pct=50.0,
            embedding_json=json.dumps([0.4, 0.5, 0.6])
        )
        db.add(child1)
        db.add(child2)
        db.commit()
        
        return root

    @staticmethod
    def get_dag(db: Session, job_id: str):
        return db.query(DAGNode).filter(DAGNode.job_id == job_id).all()
