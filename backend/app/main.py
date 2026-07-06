from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api import chat, resume, sessions, mock_interview, waitlist, auth, assistant, code_runner, drills
from app.db.database import init_db

app = FastAPI(title="PrepAgent API", version="2.4.0")

app.state.limiter = waitlist.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(mock_interview.router, prefix="/api/mock", tags=["mock"])
app.include_router(waitlist.router, prefix="/api/waitlist", tags=["waitlist"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])
app.include_router(code_runner.router, prefix="/api/code", tags=["code"])
app.include_router(drills.router, prefix="/api/drills", tags=["drills"])

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.4.0"}
