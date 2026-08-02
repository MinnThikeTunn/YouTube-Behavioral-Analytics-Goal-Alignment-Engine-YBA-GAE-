import time
import pytest
from datetime import datetime
from app.db.session import SessionLocal, Base, engine
from app.db.models import Job, RawRecord, RecordType
from app.api.v1.analytics import build_hourly_heatmap

def test_repro_heatmap_slowness():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    job_id = "test_perf_job"
    goal_text = "Software Engineering & Python Development"

    db.query(RawRecord).filter(RawRecord.job_id == job_id).delete()
    db.query(Job).filter(Job.id == job_id).delete()
    db.commit()

    job = Job(id=job_id, goal_text=goal_text, status="COMPLETED")
    db.add(job)

    # Insert 240 records (10 per hour across all 24 hours)
    raw_mappings = []
    for h in range(24):
        for i in range(10):
            raw_mappings.append({
                "job_id": job_id,
                "timestamp": datetime(2026, 8, 2, h, i * 5, 0),
                "raw_title": f"Watched Python FastAPI Tutorial Hour {h} Item {i}",
                "title_url": f"https://www.youtube.com/watch?v=v_{h}_{i}",
                "video_id": f"v_{h}_{i}",
                "record_type": RecordType.VIDEO
            })
    db.bulk_insert_mappings(RawRecord, raw_mappings)
    db.commit()

    t0 = time.time()
    heatmap = build_hourly_heatmap(db, job_id, goal_text)
    t_elapsed = time.time() - t0

    print(f"\nHeatmap calculation time for 24 hours: {t_elapsed:.4f} seconds!")
    assert len(heatmap) == 24
    # Performance assertion: Heatmap build time must be fast (< 2.0 seconds)
    assert t_elapsed < 2.0, f"Heatmap building took too long: {t_elapsed:.2f} seconds!"
