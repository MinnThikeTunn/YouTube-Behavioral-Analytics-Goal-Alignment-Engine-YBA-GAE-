import pytest
from app.db.models import RecordType
from app.services.classifier import EntryClassifier

def test_extract_video_id():
    url = "https://www.youtube.com/watch?v=ewceqg9sRdM"
    assert EntryClassifier.extract_video_id(url) == "ewceqg9sRdM"
    
    url_with_params = "https://www.youtube.com/watch?v=0ZMc2DaP4ls&feature=shared"
    assert EntryClassifier.extract_video_id(url_with_params) == "0ZMc2DaP4ls"

    assert EntryClassifier.extract_video_id("https://www.youtube.com/channel/UC123") is None
    assert EntryClassifier.extract_video_id(None) is None

def test_extract_channel_info():
    subtitles = [{"name": "freeCodeCamp.org", "url": "https://www.youtube.com/channel/UC8butISFwT-Wl7EV0hUK0BQ"}]
    cid, name = EntryClassifier.extract_channel_info(subtitles)
    assert cid == "UC8butISFwT-Wl7EV0hUK0BQ"
    assert name == "freeCodeCamp.org"

def test_classify_video_record():
    raw = {
        "header": "YouTube",
        "title": "Watched Python Programming for Beginners",
        "titleUrl": "https://www.youtube.com/watch?v=rfscVqOAgA4",
        "time": "2026-07-26T10:00:00.000Z"
    }
    assert EntryClassifier.classify_record(raw) == RecordType.VIDEO

def test_classify_community_post():
    raw = {
        "header": "YouTube",
        "title": "Viewed a community post from Fireship",
        "titleUrl": "https://www.youtube.com/post/Ugkx1234567890",
        "time": "2026-07-26T10:00:00.000Z"
    }
    assert EntryClassifier.classify_record(raw) == RecordType.COMMUNITY_POST

def test_classify_ad_impression():
    raw = {
        "header": "YouTube",
        "title": "Viewed Ads On YouTube Homepage",
        "time": "2026-07-26T10:00:00.000Z"
    }
    assert EntryClassifier.classify_record(raw) == RecordType.AD

def test_classify_non_viewing_activity():
    raw = {
        "header": "YouTube",
        "title": "Used Shorts creation tools",
        "time": "2026-07-26T10:00:00.000Z"
    }
    assert EntryClassifier.classify_record(raw) == RecordType.NON_VIEWING_ACTIVITY

def test_process_and_classify_records():
    raw_list = [
        {
            "header": "YouTube",
            "title": "Watched Python Tutorial",
            "titleUrl": "https://www.youtube.com/watch?v=rfscVqOAgA4",
            "time": "2026-07-26T10:05:00.000Z"
        },
        {
            "header": "YouTube",
            "title": "Viewed Ads On YouTube Homepage",
            "time": "2026-07-26T10:00:00.000Z"
        },
        {
            "header": "YouTube",
            "title": "Viewed a post",
            "titleUrl": "https://www.youtube.com/post/Ugkx123456",
            "time": "2026-07-26T10:02:00.000Z"
        }
    ]

    classified, counts = EntryClassifier.process_and_classify_records(raw_list)

    assert counts["total"] == 3
    assert counts["video"] == 1
    assert counts["community_post"] == 1
    assert counts["ad"] == 1

    # Verify timestamps are sorted ascending
    assert classified[0]["raw_title"] == "Viewed Ads On YouTube Homepage"
    assert classified[1]["raw_title"] == "Viewed a post"
    assert classified[2]["raw_title"] == "Watched Python Tutorial"
