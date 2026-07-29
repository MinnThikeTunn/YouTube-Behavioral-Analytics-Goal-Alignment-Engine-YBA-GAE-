---
name: background-queue-management
description: Asynchronous task queue implementation and job progress polling architecture guidance using Huey or Celery with SQLite/Redis. Use this skill whenever setting up background processing queues, job status polling endpoints (`/api/v1/jobs/{job_id}/status`), decoupled file upload handlers (`202 Accepted`), or task recovery and progress percentage updates.
---

# Background Queue Management & Polling Architecture

This skill provides comprehensive instructions for building decoupled, asynchronous background task queues (using Huey or Celery) and job status polling mechanisms for long-running data ingestion jobs.

## 1. Decoupled Ingestion & Polling Architecture

Parsing thousands of watch history entries and making batched API requests exceeds standard HTTP request timeouts (30s). **NEVER** process watch histories synchronously inside web request handlers.

```
┌─────────────────┐       POST /api/v1/upload (file, goal)      ┌──────────────────┐
│ Client UI       │ ──────────────────────────────────────────► │ FastAPI Endpoint │
└────────┬────────┘                                             └────────┬─────────┘
         │                                                               │ 1. Save file to disk
         │ 2. Return HTTP 202 Accepted {job_id: "uuid"}                 │ 2. Create DB Job row
         │ ◄────────────────────────────────────────────────────────────┤ 3. Enqueue Task
         │                                                               │
         │ GET /api/v1/jobs/{job_id}/status                             ▼
         ├───────────────────────────────────────────────────► ┌──────────────────┐
         │ ◄────────────────────────────────────────────────── │ Task Queue       │
         │    Return {status: "PROCESSING", progress_pct: 45.0}│ (Huey / Celery)  │
         │                                                     └────────┬─────────┘
         │                                                              │
         │                                                              ▼
         │                                                     ┌──────────────────┐
         │                                                     │ Background Worker│
         │                                                     │ - Enriches API   │
         │                                                     │ - Computes Math  │
         │                                                     │ - Updates DB Job │
         │                                                     └──────────────────┘
```

---

## 2. Job Database Model & Status Lifecycle

### Enum States (`JobStatus`)
1. **`QUEUED`**: Task is enqueued, waiting for worker pickup.
2. **`PROCESSING`**: Worker actively parsing file or executing API lookups.
3. **`QUOTA_PAUSED`**: API quota exceeded (403); paused until 00:00 PST auto-resume.
4. **`COMPLETED`**: Analytics & goal alignment score ready for fetch.
5. **`FAILED`**: Unrecoverable error encountered (details saved to DB).

### Progress Fields
- `progress_pct`: Float (0.0 to 100.0)
- `total_records`: Integer
- `video_records`: Integer
- `community_post_records`: Integer
- `ad_records`: Integer
- `non_viewing_records`: Integer

---

## 3. Implementation Patterns (FastAPI + Huey)

### Step A: FastAPI Upload Endpoint
```python
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, status
from fastapi.responses import JSONResponse
import uuid

app = FastAPI()

@app.post("/api/v1/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_watch_history(
    file: UploadFile = File(...),
    goal_text: str = Form(...)
):
    job_id = str(uuid.uuid4())
    file_path = f"/tmp/uploads/{job_id}.json"
    
    # Save file asynchronously
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    # Create DB Job entry
    db_job = Job(id=job_id, status="QUEUED", goal_text=goal_text, progress_pct=0.0)
    db.add(db_job)
    db.commit()
    
    # Dispatch Huey background task
    process_takeout_job.task(job_id, file_path)
    
    return {
        "job_id": job_id,
        "status": "QUEUED",
        "message": "File upload accepted. Processing started in background."
    }
```

### Step B: Status Polling Endpoint
```python
@app.get("/api/v1/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return JSONResponse(status_code=404, content={"message": "Job not found"})
        
    return {
        "job_id": job.id,
        "status": job.status,
        "progress_pct": job.progress_pct,
        "total_records": job.total_records,
        "video_records": job.video_records,
        "created_at": job.created_at,
        "completed_at": job.completed_at
    }
```
