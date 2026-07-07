from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel
from app.db.database import get_db, Session as DBSession
from app.agents.tools import evaluate_answer_tool

router = APIRouter()


class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str


@router.post("/evaluate")
async def evaluate_answer(req: AnswerRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).where(DBSession.id == req.session_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")

    questions = s.mock_questions or []
    question = next(
        (
            q
            for idx, q in enumerate(questions)
            if str(q.get("id", "")) == req.question_id
            or str(q.get("question_id", "")) == req.question_id
            or f"q{idx + 1}" == req.question_id
        ),
        None,
    )
    if not question:
        raise HTTPException(404, "Question not found")

    from app.agents.graph import invoke_agent, AgentState
    from app.db.database import ChatMessage
    from langchain_core.messages import AIMessage, HumanMessage

    # Load message history
    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == req.session_id)
        .order_by(ChatMessage.created_at)
    )
    all_msgs = messages_result.scalars().all()
    
    langchain_messages = []
    for msg in all_msgs:
        if msg.role == "user":
            langchain_messages.append(HumanMessage(content=msg.content))
        else:
            langchain_messages.append(AIMessage(content=msg.content))
    
    langchain_messages.append(HumanMessage(content=req.answer))

    state: AgentState = {
        "messages": langchain_messages,
        "company": s.company,
        "role": s.role,
        "timeline_days": s.timeline_days or 14,
        "resume_text": "",
        "resume_analysis": s.resume_analysis,
        "rag_documents": None,
        "weak_areas": s.weak_areas,
        "study_plan": s.study_plan,
        "mock_questions": s.mock_questions,
        "current_question_index": s.current_question_index or 0,
        "readiness_score": s.readiness_score,
        "session_id": req.session_id,
        "step": "eval_engine",
        "evaluation_feedback": None,
        "interviewer_persona": getattr(s, "interviewer_persona", "Standard Recruiter"),
    }

    final_state = await invoke_agent(state)
    feedback = final_state.get("evaluation_feedback") or {
        "score_delta": 0,
        "score_label": "Evaluated",
        "feedback": "Answer processed.",
        "strengths": [],
        "improvements": []
    }
    new_score = final_state.get("readiness_score", s.readiness_score)
    s.readiness_score = new_score
    s.current_question_index = final_state.get("current_question_index", s.current_question_index)
    question["candidate_answer"] = req.answer
    question["feedback"] = feedback
    
    # Update mock_questions to trigger sqlalchemy JSON detection
    s.mock_questions = questions
    flag_modified(s, "mock_questions")
    
    # Save the interaction to chat history
    db.add(ChatMessage(session_id=req.session_id, role="user", content=req.answer))
    db.add(ChatMessage(session_id=req.session_id, role="assistant", content=feedback["feedback"]))
    await db.commit()

    return {"feedback": feedback, "new_readiness_score": new_score}


@router.get("/{session_id}/next-question")
async def get_next_question(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")

    questions = s.mock_questions or []
    idx = s.current_question_index or 0
    if idx >= len(questions):
        return {"done": True, "message": "All questions completed!"}
    return {"question": questions[idx], "index": idx, "total": len(questions)}

@router.post("/{session_id}/generate-more")
async def generate_more_questions(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")

    from app.agents.graph import invoke_agent, AgentState
    state: AgentState = {
        "messages": [],
        "company": s.company,
        "role": s.role,
        "timeline_days": s.timeline_days or 14,
        "resume_text": "",
        "resume_analysis": s.resume_analysis,
        "rag_documents": None,
        "weak_areas": s.weak_areas,
        "study_plan": s.study_plan,
        "mock_questions": s.mock_questions,
        "current_question_index": 0,
        "readiness_score": s.readiness_score,
        "session_id": session_id,
        "step": "mock_questions",
        "evaluation_feedback": None,
    }

    final_state = await invoke_agent(state)
    s.mock_questions = final_state.get("mock_questions", [])
    s.current_question_index = 0
    await db.commit()

    return {"status": "success", "message": "10 new questions generated!"}


class CompleteRequest(BaseModel):
    time_taken: int

@router.post("/{session_id}/complete")
async def complete_session(session_id: str, req: CompleteRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")
        
    s.status = "COMPLETED"
    s.time_taken = req.time_taken
    
    # Calculate final score by summing the points earned during the test (max 10 per question)
    calculated_score = 0.0
    answered_count = 0
    total_questions = len(s.mock_questions) if s.mock_questions else 1
    
    if s.mock_questions:
        for q in s.mock_questions:
            ans = q.get("candidate_answer", "")
            if not ans or ans == "No answer provided.":
                continue
                
            answered_count += 1
            feedback = q.get("feedback", {})
            delta = feedback.get("score_delta", 0)
            calculated_score += delta
            
    # Calculate accuracy based on how well they did on the questions they actually attempted (max 10 points per question)
    if answered_count > 0:
        max_possible_for_answered = 10.0 * answered_count
        s.accuracy = min(100.0, max(0.0, (calculated_score / max_possible_for_answered) * 100.0))
    else:
        s.accuracy = 0.0
        
    # Final score out of 100 is based on their accuracy, scaled by how much of the test they completed
    completion_ratio = min(1.0, answered_count / total_questions)
    s.final_score = min(100.0, max(0.0, s.accuracy * completion_ratio))
    
    await db.commit()
    return {"status": "success", "message": "Session permanently completed and locked."}

@router.post("/{session_id}/pause")
async def pause_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")
        
    if s.status != "COMPLETED":
        s.status = "PAUSED"
        await db.commit()
    return {"status": "success"}
