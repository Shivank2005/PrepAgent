from dotenv import load_dotenv
load_dotenv()

from fastapi.testclient import TestClient
from app.main import app

with TestClient(app) as client:
    response = client.post("/api/chat/session", json={
        "company": "Amazon",
        "role": "SDE",
        "timeline_days": 14,
        "resume_text": "I know python."
    })
    print(response.json())
    session_id = response.json().get("session_id")

    if not session_id:
        print("Failed to get session_id")
        import sys
        sys.exit(1)

    # Now test the stream endpoint
    stream_resp = client.post("/api/chat/stream", json={
        "message": "Init",
        "session_id": session_id,
        "company": "Amazon",
        "role": "SDE",
        "timeline_days": 14,
        "resume_text": "I know python.",
        "workflow_only": True
    })
    print(stream_resp.status_code)
    for line in stream_resp.iter_lines():
        if line:
            print(line)
