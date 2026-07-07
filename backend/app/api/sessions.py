from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm.attributes import flag_modified
from app.db.database import get_db, Session as DBSession, ChatMessage, AsyncSessionLocal
from collections import Counter
from app.api.auth import get_current_user
from app.db.database import User
import os
import json
from datetime import datetime, timedelta
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel
from app.agents.tools import generate_study_plan_tool

router = APIRouter()

class AddGapRequest(BaseModel):
    gap: str


def serialize_session(session: DBSession) -> dict:
    return {
        "id": session.id,
        "company": session.company,
        "role": session.role,
        "timeline_days": session.timeline_days,
        "readiness_score": session.readiness_score,
        "weak_areas": session.weak_areas,
        "study_plan": session.study_plan,
        "mock_questions": session.mock_questions,
        "current_question_index": session.current_question_index,
        "resume_analysis": session.resume_analysis,
        "completed_tasks": session.completed_tasks,
        "status": session.status,
        "time_taken": session.time_taken,
        "accuracy": session.accuracy,
        "final_score": session.final_score,
        "interviewer_persona": getattr(session, "interviewer_persona", "Standard Recruiter"),
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }

@router.get("/")
async def list_sessions(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(DBSession).where(DBSession.user_id == current_user.id).order_by(DBSession.created_at.desc()).limit(20))
    sessions = result.scalars().all()
    return [{"id": s.id, "company": s.company, "role": s.role, "readiness_score": s.readiness_score} for s in sessions]

@router.get("/history")
async def session_history(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get last 15 sessions, ordered newest to oldest, then reverse to return chronological
    result = await db.execute(select(DBSession).where(DBSession.user_id == current_user.id).order_by(DBSession.created_at.desc()).limit(15))
    sessions = result.scalars().all()
    sessions.reverse()
    return [{"id": s.id, "company": s.company, "role": s.role, "readiness_score": s.readiness_score, "status": s.status, "time_taken": s.time_taken, "final_score": s.final_score, "accuracy": s.accuracy, "created_at": s.created_at.isoformat() if s.created_at else None} for s in sessions]


@router.get("/analytics-summary")
async def analytics_summary(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(DBSession).where(DBSession.user_id == current_user.id).order_by(DBSession.created_at.asc()))
    sessions = result.scalars().all()

    if not sessions:
        return {
            "total_sessions": 0,
            "completed_sessions": 0,
            "average_readiness": 0,
            "latest_readiness": 0,
            "readiness_change": 0,
            "completion_rate": 0,
            "average_time_taken": 0,
            "top_company": None,
            "company_counts": [],
            "weak_area_counts": [],
            "recent_trend": [],
        }

    readiness_values = [float(s.readiness_score or 0) for s in sessions if s.readiness_score is not None]
    final_scores = [float(s.final_score or 0) for s in sessions if s.final_score is not None]
    completed_sessions = [s for s in sessions if (s.status or "").upper() == "COMPLETED"]
    time_taken_values = [int(s.time_taken or 0) for s in sessions if s.time_taken is not None]

    company_counts = Counter(s.company for s in sessions if s.company)
    weak_area_counts: Counter[str] = Counter()
    for session in sessions:
        for weak_area in session.weak_areas or []:
            if isinstance(weak_area, str) and weak_area.strip():
                weak_area_counts[weak_area.strip()] += 1
            elif isinstance(weak_area, dict):
                label = weak_area.get("topic") or weak_area.get("name") or weak_area.get("label")
                if label:
                    weak_area_counts[str(label)] += 1

    recent_sessions = sessions[-8:]
    recent_trend = [
        {
            "date": session.created_at.isoformat() if session.created_at else None,
            "company": session.company,
            "score": float(session.final_score or session.readiness_score or 0),
        }
        for session in recent_sessions
    ]

    latest_session = sessions[-1]
    previous_session = sessions[-2] if len(sessions) > 1 else None
    latest_readiness = float(latest_session.final_score or latest_session.readiness_score or 0)
    previous_readiness = float(previous_session.final_score or previous_session.readiness_score or 0) if previous_session else latest_readiness

    total_tasks = 0
    completed_tasks = 0
    for session in sessions:
        tasks = session.completed_tasks or {}
        if isinstance(tasks, dict):
            completed_tasks += sum(1 for value in tasks.values() if bool(value))
            total_tasks += len(tasks)

    return {
        "total_sessions": len(sessions),
        "completed_sessions": len(completed_sessions),
        "average_readiness": round(sum(readiness_values) / len(readiness_values), 1) if readiness_values else 0,
        "latest_readiness": round(latest_readiness, 1),
        "readiness_change": round(latest_readiness - previous_readiness, 1),
        "completion_rate": round((completed_tasks / total_tasks) * 100, 1) if total_tasks else 0,
        "average_time_taken": round(sum(time_taken_values) / len(time_taken_values), 1) if time_taken_values else 0,
        "top_company": company_counts.most_common(1)[0][0] if company_counts else None,
        "company_counts": [{"company": company, "count": count} for company, count in company_counts.most_common(6)],
        "weak_area_counts": [{"topic": topic, "count": count} for topic, count in weak_area_counts.most_common(6)],
        "recent_trend": recent_trend,
    }


@router.get("/streak/current")
async def current_streak(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, timedelta
    
    result = await db.execute(select(DBSession).where(DBSession.user_id == current_user.id).order_by(DBSession.created_at.asc()))
    sessions = result.scalars().all()
    
    if not sessions:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "last_session_date": None,
            "days_since_last": None,
        }
    
    # Get unique dates (in UTC) when sessions were created
    session_dates = set()
    for s in sessions:
        if s.created_at:
            session_dates.add(s.created_at.date())
    
    if not session_dates:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "last_session_date": None,
            "days_since_last": None,
        }
    
    # Sort dates chronologically
    sorted_dates = sorted(session_dates)
    
    # Calculate streaks
    current_streak = 0
    best_streak = 0
    temp_streak = 1
    
    for i in range(len(sorted_dates)):
        if i > 0:
            # Check if consecutive days (today vs yesterday)
            if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                temp_streak += 1
            else:
                best_streak = max(best_streak, temp_streak)
                temp_streak = 1
    
    best_streak = max(best_streak, temp_streak)
    
    # Calculate current streak (counting from today backwards)
    today = datetime.utcnow().date()
    if sorted_dates[-1] == today or sorted_dates[-1] == today - timedelta(days=1):
        # User has a session today or yesterday, calculate active streak
        current_streak = 1
        for i in range(len(sorted_dates) - 2, -1, -1):
            if (sorted_dates[i+1] - sorted_dates[i]).days == 1:
                current_streak += 1
            else:
                break
    
    last_session_date = sorted_dates[-1]
    days_since_last = (today - last_session_date).days if last_session_date else None
    
    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "last_session_date": last_session_date.isoformat() if last_session_date else None,
        "days_since_last": days_since_last,
    }


@router.get("/{session_id}/export")
async def export_session(session_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id, DBSession.user_id == current_user.id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = messages_result.scalars().all()

    return {
        "session": serialize_session(session),
        "messages": [
            {
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at.isoformat() if message.created_at else None,
            }
            for message in messages
        ],
    }

from app.api.report_template import LLM_ANALYSIS_PROMPT, build_report_html

@router.get("/{session_id}/report/llm")
async def generate_llm_report(session_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id, DBSession.user_id == current_user.id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = messages_result.scalars().all()

    # Build questions payload from mock_questions + chat messages
    questions = []
    if session.mock_questions:
        for idx, q in enumerate(session.mock_questions):
            q_text = q.get("question", "")
            candidate_answer = q.get("candidate_answer", "No answer provided.")
            
            # Fallback for old sessions that didn't save candidate_answer directly
            if candidate_answer == "No answer provided.":
                for m_idx, m in enumerate(messages):
                    if m.role == "assistant" and q_text and q_text[:50] in m.content:
                        if m_idx + 1 < len(messages) and messages[m_idx + 1].role == "user":
                            candidate_answer = messages[m_idx + 1].content
                        break
            
            answer_type = "code" if any(kw in candidate_answer for kw in ["{", "class ", "def ", "public ", "import "]) else "text"

            questions.append({
                "id": str(idx),
                "category": q.get("type", "DSA"),
                "subcategory": (q.get("expected_topics") or ["General"])[0],
                "question_text": q_text,
                "candidate_answer": candidate_answer,
                "answer_type": answer_type,
                "language": "java" if answer_type == "code" else None
            })

    session_data = {
        "target_company": session.company,
        "target_role": session.role,
        "date": session.created_at.isoformat() if session.created_at else datetime.utcnow().isoformat(),
        "time_taken": session.time_taken,
        "final_score": session.final_score,
        "accuracy": session.accuracy,
        "questions": questions
    }

    # Step 1: Ask LLM for structured JSON analysis only
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

    llm = ChatGroq(api_key=groq_api_key, model="llama-3.3-70b-versatile", temperature=0.2)
    response = llm.invoke([
        SystemMessage(content=LLM_ANALYSIS_PROMPT),
        HumanMessage(content=json.dumps({"questions": questions, "target_company": session.company, "target_role": session.role}))
    ])

    # Parse the LLM's JSON response
    content = str(response.content).strip()
    # Strip markdown fences if present
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()

    try:
        analysis = json.loads(content)
    except json.JSONDecodeError:
        # Fallback: try to extract JSON from the response
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            try:
                analysis = json.loads(json_match.group())
            except json.JSONDecodeError:
                analysis = {
                    "key_takeaway": "Analysis could not be generated for this session.",
                    "overall_score": 0, "accuracy_pct": 0,
                    "dimensions": [], "growth_opportunities": [],
                    "study_plan": {"week1_title": "Review", "week1_rows": [], "week2_title": "Practice", "week2_rows": []},
                    "questions_analysis": []
                }
        else:
            analysis = {
                "key_takeaway": "Analysis could not be generated for this session.",
                "overall_score": 0, "accuracy_pct": 0,
                "dimensions": [], "growth_opportunities": [],
                "study_plan": {"week1_title": "Review", "week1_rows": [], "week2_title": "Practice", "week2_rows": []},
                "questions_analysis": []
            }

    # Step 2: Build the HTML from the hardcoded template + analysis data
    messages_data = [
        {"role": m.role, "content": m.content}
        for m in messages
        if m.content and m.content.strip()
    ]

    html_output = build_report_html(session_data, analysis, messages_data)

    return {"html": html_output}

from pydantic import BaseModel
class UpdateTasksRequest(BaseModel):
    completed_tasks: dict

from fastapi import HTTPException
@router.post("/{session_id}/tasks")
async def update_session_tasks(session_id: str, req: UpdateTasksRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id, DBSession.user_id == current_user.id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    s.completed_tasks = req.completed_tasks
    await db.commit()
    return {"status": "ok", "completed_tasks": s.completed_tasks}


@router.get("/company/{company}/streak")
async def company_streak(company: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, timedelta
    
    result = await db.execute(
        select(DBSession)
        .where(DBSession.company == company)
        .order_by(DBSession.created_at.asc())
    )
    sessions = result.scalars().all()
    
    if not sessions:
        return {
            "company": company,
            "current_streak": 0,
            "best_streak": 0,
            "total_attempts": 0,
            "best_score": 0,
            "latest_score": 0,
            "improvement": 0,
            "last_session_date": None,
        }
    
    # Get unique dates when this company was practiced
    company_dates = set()
    for s in sessions:
        if s.created_at:
            company_dates.add(s.created_at.date())
    
    if not company_dates:
        return {
            "company": company,
            "current_streak": 0,
            "best_streak": 0,
            "total_attempts": 0,
            "best_score": 0,
            "latest_score": 0,
            "improvement": 0,
            "last_session_date": None,
        }
    
    sorted_dates = sorted(company_dates)
    
    # Calculate streaks
    current_streak = 0
    best_streak = 0
    temp_streak = 1
    
    for i in range(len(sorted_dates)):
        if i > 0:
            if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                temp_streak += 1
            else:
                best_streak = max(best_streak, temp_streak)
                temp_streak = 1
    
    best_streak = max(best_streak, temp_streak)
    
    # Calculate current streak (from today backwards)
    today = datetime.utcnow().date()
    if sorted_dates[-1] == today or sorted_dates[-1] == today - timedelta(days=1):
        current_streak = 1
        for i in range(len(sorted_dates) - 2, -1, -1):
            if (sorted_dates[i+1] - sorted_dates[i]).days == 1:
                current_streak += 1
            else:
                break
    
    # Score analytics
    scores = [float(s.final_score or s.readiness_score or 0) for s in sessions]
    best_score = max(scores) if scores else 0
    latest_score = float(sessions[-1].final_score or sessions[-1].readiness_score or 0)
    improvement = latest_score - scores[0] if len(scores) > 1 else 0
    
    last_session_date = sorted_dates[-1]
    
    return {
        "company": company,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "total_attempts": len(sessions),
        "best_score": round(best_score, 1),
        "latest_score": round(latest_score, 1),
        "improvement": round(improvement, 1),
        "last_session_date": last_session_date.isoformat() if last_session_date else None,
    }


@router.get("/companies/focus-list")
async def company_focus_list(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return top companies by attempt count with their streaks and metrics"""
    result = await db.execute(select(DBSession).where(DBSession.user_id == current_user.id).order_by(DBSession.created_at.asc()))
    sessions = result.scalars().all()
    
    if not sessions:
        return {"focus_companies": []}
    
    company_stats: dict[str, dict] = {}
    
    for session in sessions:
        if not session.company:
            continue
        
        if session.company not in company_stats:
            company_stats[session.company] = {
                "company": session.company,
                "attempts": 0,
                "scores": [],
                "dates": set(),
                "roles": []
            }
        
        company_stats[session.company]["attempts"] += 1
        company_stats[session.company]["scores"].append(
            float(session.final_score or session.readiness_score or 0)
        )
        if session.created_at:
            company_stats[session.company]["dates"].add(session.created_at.date())
        if session.role and session.role not in company_stats[session.company]["roles"]:
            company_stats[session.company]["roles"].append(session.role)
    
    # Convert to sortable format and calculate streaks
    from datetime import datetime, timedelta
    focus_list = []
    
    for company, stats in company_stats.items():
        sorted_dates = sorted(stats["dates"]) if stats["dates"] else []
        
        # Simple streak for last 3 days
        current_streak = 0
        today = datetime.utcnow().date()
        if sorted_dates:
            if sorted_dates[-1] == today or sorted_dates[-1] == today - timedelta(days=1):
                current_streak = 1
                for i in range(len(sorted_dates) - 2, -1, -1):
                    if (sorted_dates[i+1] - sorted_dates[i]).days == 1:
                        current_streak += 1
                    else:
                        break
        
        scores = stats["scores"]
        avg_score = sum(scores) / len(scores) if scores else 0
        best_score = max(scores) if scores else 0
        improvement = scores[-1] - scores[0] if len(scores) > 1 else 0
        
        focus_list.append({
            "company": company,
            "attempts": stats["attempts"],
            "roles": stats["roles"],
            "current_streak": current_streak,
            "avg_score": round(avg_score, 1),
            "best_score": round(best_score, 1),
            "latest_score": round(scores[-1], 1) if scores else 0,
            "improvement": round(improvement, 1),
            "days_practiced": len(sorted_dates),
        })
    
    # Sort by attempts (most practiced first)
    focus_list.sort(key=lambda x: x["attempts"], reverse=True)
    
    return {"focus_companies": focus_list[:5]}


@router.delete("/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id, DBSession.user_id == current_user.id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.execute(delete(ChatMessage).where(ChatMessage.session_id == session_id))
    await db.delete(session)
    await db.commit()
    return {"status": "ok", "message": "Session deleted"}


@router.get("/compare")
async def compare_sessions(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), 
    company: str | None = None, 
    role: str | None = None,
    session_a: str | None = None,
    session_b: str | None = None
):
    if session_a and session_b:
        result_a = await db.execute(select(DBSession).where(DBSession.id == session_a))
        result_b = await db.execute(select(DBSession).where(DBSession.id == session_b))
        sa = result_a.scalar_one_or_none()
        sb = result_b.scalar_one_or_none()
        
        if not sa or not sb:
            raise HTTPException(404, "One or both sessions not found")
            
        return {
            "session_a": serialize_session(sa),
            "session_b": serialize_session(sb)
        }
    
    query = select(DBSession).where(DBSession.user_id == current_user.id)
    if company:
        query = query.where(DBSession.company == company)
    if role:
        query = query.where(DBSession.role == role)
        
    result = await db.execute(query.order_by(DBSession.created_at.desc()))
    sessions = result.scalars().all()
    
    return [serialize_session(s) for s in sessions]

async def background_regenerate_study_plan(session_id: str):
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(DBSession).where(DBSession.id == session_id, DBSession.user_id == current_user.id))
            session = result.scalar_one_or_none()
            if session:
                plan = await generate_study_plan_tool(
                    weak_areas=session.weak_areas,
                    timeline_days=session.timeline_days,
                    company=session.company,
                )
                session.study_plan = plan
                flag_modified(session, "study_plan")
                await db.commit()
    except Exception as e:
        print(f"Error regenerating study plan: {e}")

@router.post("/{session_id}/gaps")
async def add_custom_gap(
    session_id: str,
    req: AddGapRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id, DBSession.user_id == current_user.id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    current_gaps = list(session.weak_areas) if session.weak_areas else []
    if req.gap not in current_gaps:
        current_gaps.append(req.gap)
        session.weak_areas = current_gaps
        session.study_plan = None
        flag_modified(session, "weak_areas")
        flag_modified(session, "study_plan")
        await db.commit()
        
        background_tasks.add_task(background_regenerate_study_plan, session_id)
        
    return {"status": "success", "weak_areas": session.weak_areas}
