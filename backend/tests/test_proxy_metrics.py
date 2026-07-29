import pytest
from datetime import datetime, timedelta
from app.db.models import RawRecord, RecordType
from app.services.proxy_metrics import ProxyMetricsEngine

def test_calculate_completion_probabilities():
    t0 = datetime(2026, 7, 26, 10, 0, 0)
    t1 = t0 + timedelta(seconds=300)   # 5 min gap (300s) on 600s video -> P = 0.5
    t2 = t1 + timedelta(seconds=3600)  # 60 min gap (>30 min cutoff) -> Session boundary, P = 1.0

    records = [
        RawRecord(id=1, timestamp=t0, video_id="vid_1", record_type=RecordType.VIDEO),
        RawRecord(id=2, timestamp=t1, video_id="vid_2", record_type=RecordType.VIDEO),
        RawRecord(id=3, timestamp=t2, video_id="vid_3", record_type=RecordType.VIDEO),
    ]

    duration_map = {
        "vid_1": 600,   # 10 mins
        "vid_2": 1200,  # 20 mins
        "vid_3": 300    # 5 mins
    }

    probs = ProxyMetricsEngine.calculate_completion_probabilities(records, duration_map)
    assert len(probs) == 3
    assert pytest.approx(probs[0], 0.01) == 0.5   # 300s / 600s = 0.5
    assert probs[1] == 1.0                        # >30 min gap -> 1.0 (session end boundary)
    assert probs[2] == 1.0                        # Final video in dataset -> 1.0

def test_calculate_session_density():
    t0 = datetime(2026, 7, 26, 10, 0, 0)
    t1 = t0 + timedelta(minutes=15)
    t2 = t0 + timedelta(minutes=30)
    # Session 1: 3 clicks across 30 minutes (0.5 hrs) -> Density = 3 / 0.5 = 6 clicks/hr

    t3 = t0 + timedelta(hours=2) # Gap > 30 mins -> Session 2 starts
    t4 = t3 + timedelta(minutes=10)
    # Session 2: 2 clicks across 10 minutes (1/6 hrs) -> Density = 2 / (1/6) = 12 clicks/hr

    records = [
        RawRecord(id=1, timestamp=t0, record_type=RecordType.VIDEO),
        RawRecord(id=2, timestamp=t1, record_type=RecordType.VIDEO),
        RawRecord(id=3, timestamp=t2, record_type=RecordType.VIDEO),
        RawRecord(id=4, timestamp=t3, record_type=RecordType.VIDEO),
        RawRecord(id=5, timestamp=t4, record_type=RecordType.VIDEO),
    ]

    density = ProxyMetricsEngine.calculate_session_density(records)
    # Mean of Session 1 (6.0) and Session 2 (12.0) = 9.0 clicks/hr
    assert pytest.approx(density, 0.1) == 9.0

def test_calculate_circadian_score():
    records = [
        RawRecord(id=1, timestamp=datetime(2026, 7, 26, 14, 0, 0), record_type=RecordType.VIDEO), # Daytime (14:00)
        RawRecord(id=2, timestamp=datetime(2026, 7, 26, 23, 30, 0), record_type=RecordType.VIDEO), # Late Night (23:30)
        RawRecord(id=3, timestamp=datetime(2026, 7, 27, 2, 15, 0), record_type=RecordType.VIDEO),  # Late Night (02:15)
        RawRecord(id=4, timestamp=datetime(2026, 7, 27, 9, 0, 0), record_type=RecordType.VIDEO),   # Daytime (09:00)
    ]

    # 2 out of 4 clicks between 23:00 and 05:00 = 50.0%
    circadian = ProxyMetricsEngine.calculate_circadian_score(records)
    assert circadian == 50.0
