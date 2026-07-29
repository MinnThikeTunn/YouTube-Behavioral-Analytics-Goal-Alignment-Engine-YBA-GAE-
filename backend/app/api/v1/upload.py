import uuid
import shutil
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Job, JobStatus
from app.schemas.job import UploadResponseDTO
from app.config import UPLOADS_DIR
from app.workers.tasks import execute_processing_pipeline

router = APIRouter()

@router.post("/upload", response_model=UploadResponseDTO, status_code=status.HTTP_202_ACCEPTED)
async def upload_watch_history(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    goal_text: str = Form(...),
    api_key: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".json"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid watch-history.json file."
        )

    job_id = str(uuid.uuid4())
    save_path = UPLOADS_DIR / f"{job_id}.json"

    # Save uploaded file
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save upload file: {str(e)}"
        )

    # Insert Job ORM record
    new_job = Job(
        id=job_id,
        status=JobStatus.QUEUED,
        goal_text=goal_text,
        user_api_key=api_key,
        progress_pct=0.0,
        created_at=datetime.utcnow()
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Schedule background processing task
    background_tasks.add_task(execute_processing_pipeline, job_id, str(save_path))

    return UploadResponseDTO(
        job_id=new_job.id,
        status=new_job.status,
        message="Watch history uploaded successfully. Processing started.",
        created_at=new_job.created_at
    )
