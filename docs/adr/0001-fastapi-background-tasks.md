# 1. Use Native FastAPI BackgroundTasks for Ingestion & Processing Pipeline

* **Status:** Accepted
* **Date:** 2026-07-29

## Context and Problem Statement
The system requires asynchronous processing of large Google Takeout `watch-history.json` files, batched YouTube Data API v3 metadata lookups, vector embedding similarity computations, and metric calculations. The application must run in a non-containerized (native host) environment without requiring Docker or complex daemon setup on Windows.

## Decision Drivers
- Non-containerized execution constraint (no Docker required).
- Zero external service dependencies (avoiding mandatory Redis/RabbitMQ setup on Windows).
- Clean developer experience using standard Python `asyncio` and thread pools.

## Considered Options
1. Native FastAPI `BackgroundTasks` + SQLite DB state persistence
2. Huey task worker with SQLite broker
3. Celery worker with Redis broker

## Decision Outcome
Chosen Option: **1. Native FastAPI `BackgroundTasks` + SQLite DB state persistence**.

### Positive Consequences
- **Zero External Dependencies**: Runs completely within the FastAPI Uvicorn process. No Redis, RabbitMQ, or extra worker daemons needed.
- **Cross-Platform Simplicity**: Easily runs on Windows native Python without Docker.
- **Persistent State**: Progress percentage, job status (`QUEUED`, `PROCESSING`, `QUOTA_PAUSED`, `COMPLETED`, `FAILED`) are persisted in SQLite DB.

### Negative Consequences / Mitigation
- **Process Lifetime Dependency**: If Uvicorn web server restarts mid-job, background task is interrupted.
- *Mitigation*: The DB stores batch progress; on startup or resume, jobs can resume from the last un-enriched batch.
