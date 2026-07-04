from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db, Session as DBSession

router = APIRouter()

@router.get("/")
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).order_by(DBSession.created_at.desc()).limit(20))
    sessions = result.scalars().all()
    return [{"id": s.id, "company": s.company, "role": s.role, "readiness_score": s.readiness_score} for s in sessions]

@router.get("/history")
async def session_history(db: AsyncSession = Depends(get_db)):
    # Get last 15 sessions, ordered oldest to newest for chronological charting
    result = await db.execute(select(DBSession).order_by(DBSession.created_at.asc()).limit(15))
    sessions = result.scalars().all()
    return [{"id": s.id, "company": s.company, "role": s.role, "readiness_score": s.readiness_score, "status": s.status, "time_taken": s.time_taken, "final_score": s.final_score, "accuracy": s.accuracy, "created_at": s.created_at.isoformat() if s.created_at else None} for s in sessions]

from pydantic import BaseModel
class UpdateTasksRequest(BaseModel):
    completed_tasks: dict

from fastapi import HTTPException
@router.post("/{session_id}/tasks")
async def update_session_tasks(session_id: str, req: UpdateTasksRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    s.completed_tasks = req.completed_tasks
    await db.commit()
    return {"status": "ok", "completed_tasks": s.completed_tasks}
