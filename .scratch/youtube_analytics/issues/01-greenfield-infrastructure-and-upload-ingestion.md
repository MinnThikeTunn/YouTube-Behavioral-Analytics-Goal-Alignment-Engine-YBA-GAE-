# 01 — Greenfield Infrastructure & End-to-End Upload Ingestion

**What to build:**
Set up the core project architecture matching the non-containerized stack:
1. **Backend:** FastAPI application structure with SQLite database models (`Job`, `RawRecord`) and API router (`POST /api/v1/upload`).
2. **Frontend:** React + Vite + TypeScript + Tailwind CSS project with `FileUploaderComponent` matching the Perplexity aesthetic (`rounded-[32px]`, `font-black`).
3. **End-to-End Flow:** User drops a `watch-history.json` file and inputs goal text. The frontend invokes `ApiClient.uploadHistory()`, calling `POST /api/v1/upload`. The backend creates a `Job` record in SQLite with `JobStatus.QUEUED`, triggers an in-process `BackgroundTasks` runner, and immediately returns `202 Accepted` with `UploadResponseDTO(job_id, status=QUEUED, created_at)`.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] FastAPI backend initialized with `uvicorn` and SQLite engine connection in `app/db/session.py`.
- [x] SQLAlchemy ORM schemas created for `Job` and `RawRecord` in `app/db/models.py`.
- [x] `UploadController` endpoint (`POST /api/v1/upload`) returns `UploadResponseDTO` with `202 Accepted`.
- [x] React (Vite) frontend boilerplate initialized with Tailwind CSS and Lucide icons.
- [x] `FileUploaderComponent` renders drag-and-drop dropzone and goal text selector in Perplexity styling.
- [x] Integration test verifies uploading a sample JSON file creates a `QUEUED` job in SQLite and returns a valid `job_id`.
