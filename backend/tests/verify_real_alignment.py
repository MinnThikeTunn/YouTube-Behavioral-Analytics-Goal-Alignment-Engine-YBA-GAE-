import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import time
from app.db.session import SessionLocal, engine, Base
from app.db.models import Job, JobStatus, RawRecord, ComputedMetric
from app.services.classifier import EntryClassifier
from app.services.proxy_metrics import ProxyMetricsEngine
from app.services.goal_alignment import GoalAlignmentEngine

def verify_real_alignment():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    job_id = "test_real_job"
    goal_text = "Software Engineering"

    print("Step 1: Parsing and Classifying 15,100 records...")
    with open("D:/DAProject/watch-history.json", "r", encoding="utf-8") as f:
        raw_records = json.load(f)

    job = Job(id=job_id, goal_text=goal_text, status=JobStatus.PROCESSING)
    db.add(job)
    db.commit()

    classified, counts = EntryClassifier.process_and_classify_records(raw_records)
    raw_mappings = [
        {
            "job_id": job_id,
            "timestamp": item["timestamp"],
            "raw_title": item["raw_title"],
            "title_url": item["title_url"],
            "video_id": item["video_id"],
            "record_type": item["record_type"]
        }
        for item in classified
    ]
    db.bulk_insert_mappings(RawRecord, raw_mappings)
    db.commit()

    print("Step 2: Computing Proxy Metrics...")
    ProxyMetricsEngine.compute_job_metrics(db, job_id)

    print("Step 3: Evaluating Batched Goal Alignment with PyTorch Matrix Ops...")
    t0 = time.time()
    score_orm, recs = GoalAlignmentEngine.evaluate_job_alignment(db, job_id, goal_text)
    t_elapsed = time.time() - t0

    print("\n================ AI Goal Alignment Results ================")
    print(f"Target Goal:                    {goal_text}")
    print(f"Goal Alignment Score:          {score_orm.alignment_probability_score}%")
    print(f"Total Isolated Videos Scored:   {counts['video']:,}")
    print(f"AI Matrix Processing Time:     {t_elapsed:.2f} seconds!")
    print("===========================================================")

    db.close()

if __name__ == "__main__":
    verify_real_alignment()
