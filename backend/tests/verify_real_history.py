import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import time
from pathlib import Path
from app.services.classifier import EntryClassifier

def verify_real_watch_history():
    file_path = Path("D:/DAProject/watch-history.json")
    if not file_path.exists():
        print(f"File {file_path} not found.")
        return

    print(f"Loading real watch history file: {file_path} (Size: {file_path.stat().st_size / (1024*1024):.2f} MB)...")
    start_time = time.time()
    
    with open(file_path, "r", encoding="utf-8") as f:
        raw_records = json.load(f)

    load_time = time.time() - start_time
    print(f"Successfully loaded {len(raw_records)} records in {load_time:.2f} seconds.")

    classify_start = time.time()
    classified_records, counts = EntryClassifier.process_and_classify_records(raw_records)
    classify_time = time.time() - classify_start

    print("\n================ Classification Breakdown ================")
    print(f"Total Raw Records:           {counts['total']:,}")
    print(f"Isolated Video Events:      {counts['video']:,} ({counts['video']/counts['total']*100:.1f}%)")
    print(f"Community Posts Filtered:   {counts['community_post']:,}")
    print(f"Ad Impressions Filtered:    {counts['ad']:,}")
    print(f"Non-Viewing Activity:       {counts['non_viewing']:,}")
    print(f"Classification Time:         {classify_time:.2f} seconds")
    print("==========================================================")

if __name__ == "__main__":
    verify_real_watch_history()
