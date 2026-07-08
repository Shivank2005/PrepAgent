"""Chat API - SSE streaming endpoint for the LangGraph agent"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db, Session as DBSession, ChatMessage
from app.api.auth import get_current_user_optional
from app.agents.graph import agent_graph, AgentState
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
import uuid, json, asyncio

router = APIRouter()
mentor_llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.35)


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    company: str | None = None
    role: str | None = None
    timeline_days: int = 14
    resume_text: str | None = None
    workflow_only: bool = False
    force_step: str | None = None


class StartSessionRequest(BaseModel):
    company: str
    role: str | None = "Software Engineer"
    timeline_days: int = 14
    resume_text: str | None = None
    previous_session_id: str | None = None
    interviewer_persona: str | None = "Standard Recruiter"


@router.post("/session")
async def create_session(req: StartSessionRequest, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user_optional)):
    session_id = str(uuid.uuid4())
    readiness_score = None
    weak_areas = None
    study_plan = None
    resume_analysis = None
    interviewer_persona = req.interviewer_persona or "Standard Recruiter"
    
    if req.previous_session_id:
        result = await db.execute(select(DBSession).where(DBSession.id == req.previous_session_id))
        old_session = result.scalar_one_or_none()
        if old_session:
            readiness_score = old_session.readiness_score
            weak_areas = old_session.weak_areas
            study_plan = old_session.study_plan
            resume_analysis = old_session.resume_analysis
            # If not provided, fallback to the old session's persona
            if not req.interviewer_persona and old_session.interviewer_persona:
                interviewer_persona = old_session.interviewer_persona

    db_session = DBSession(
        id=session_id,
        user_id=current_user.id if current_user else None,
        company=req.company,
        role=req.role or "Software Engineer",
        timeline_days=req.timeline_days,
        readiness_score=readiness_score,
        weak_areas=weak_areas,
        study_plan=study_plan,
        resume_analysis=resume_analysis,
        mock_questions=None,
        current_question_index=0,
        interviewer_persona=interviewer_persona,
    )
    db.add(db_session)
    await db.commit()
    return {"session_id": session_id}


@router.post("/stream")
async def stream_chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    session_id = req.session_id or str(uuid.uuid4())

    # Load or create session
    result = await db.execute(select(DBSession).where(DBSession.id == session_id))
    db_session = result.scalar_one_or_none()

    if not db_session:
        db_session = DBSession(
            id=session_id,
            company=req.company or "Unknown",
            role=req.role or "Software Engineer",
            timeline_days=req.timeline_days,
            current_question_index=0,
        )
        db.add(db_session)
        await db.commit()
        await db.refresh(db_session)

    # The setup workflow is a system action. Keep it out of chat history so the
    # chat remains a clean mentor/doubt-solving space.
    if not req.workflow_only:
        user_msg = ChatMessage(session_id=session_id, role="user", content=req.message)
        db.add(user_msg)
        await db.commit()

    # Build state
    is_first_message = db_session.weak_areas is None
    step = "resume_analysis" if is_first_message else "eval_engine"
    
    if req.force_step:
        is_first_message = True
        step = req.force_step

    # Load message history for eval_engine
    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    all_msgs = messages_result.scalars().all()
    
    # Convert to LangChain messages
    from langchain_core.messages import AIMessage
    langchain_messages = []
    for msg in all_msgs:
        if msg.role == "user":
            langchain_messages.append(HumanMessage(content=msg.content))
        else:
            langchain_messages.append(AIMessage(content=msg.content))

    state: AgentState = {
        "messages": langchain_messages,
        "company": db_session.company,
        "role": db_session.role,
        "timeline_days": db_session.timeline_days,
        "resume_text": req.resume_text or "",
        "resume_analysis": db_session.resume_analysis,
        "rag_documents": None,
        "weak_areas": db_session.weak_areas,
        "study_plan": db_session.study_plan,
        "mock_questions": db_session.mock_questions,
        "current_question_index": db_session.current_question_index or 0,
        "readiness_score": db_session.readiness_score,
        "session_id": session_id,
        "step": step,
    }

    async def event_stream():
        from app.db.database import AsyncSessionLocal
        async with AsyncSessionLocal() as g_db:
            try:
                # Reload DB session inside generator session scope
                result = await g_db.execute(select(DBSession).where(DBSession.id == session_id))
                g_session = result.scalar_one_or_none()
                if not g_session:
                    raise ValueError("Session not found in generator database")


                
                # For the first setup call, run the full planning graph. Later chat
                # calls are mentor conversations; mock answer evaluation happens via
                # the dedicated /mock/evaluate endpoint.
                if is_first_message:

                    if step == "mock_questions":
                        from app.agents.graph import mock_questions_node
                        final_state = await mock_questions_node(state)
                    else:
                        final_state = await agent_graph.ainvoke(state)
                else:

                    context = {
                        "company": g_session.company,
                        "role": g_session.role,
                        "timeline_days": g_session.timeline_days,
                        "readiness_score": g_session.readiness_score,
                        "weak_areas": g_session.weak_areas,
                        "study_plan": g_session.study_plan,
                        "current_question_index": g_session.current_question_index,
                        "mock_question_count": len(g_session.mock_questions or []),
                    }
                    prompt = ChatPromptTemplate.from_messages([
                        ("system", """You are PrepAgent, a professional placement preparation mentor.
Use the candidate context to answer doubts, explain concepts, review approaches, and suggest next actions.
Do not regenerate the roadmap, question bank, or analytics in chat. Point the learner to those dashboard sections when useful.
Keep answers focused, practical, and interview-oriented."""),
                        ("human", "Candidate context JSON:\n{context}\n\nLearner message:\n{message}")
                    ])
                    chain = prompt | mentor_llm
                    full_content = ""
                    async for chunk in chain.astream({
                        "context": json.dumps(context),
                        "message": req.message,
                    }):
                        token = chunk.content
                        if token:
                            full_content += token
                            yield f"data: {json.dumps({'token': token})}\n\n"
                            await asyncio.sleep(0.005)
                    from langchain_core.messages import AIMessage
                    final_state = {
                        **state,
                        "messages": [AIMessage(content=full_content)],
                        "step": "mentor_chat",
                    }
                


                # Update DB with generated artifacts
                if is_first_message:
                    g_session.resume_analysis = final_state.get("resume_analysis")
                    g_session.weak_areas = final_state.get("weak_areas")
                    g_session.study_plan = final_state.get("study_plan")
                    g_session.mock_questions = final_state.get("mock_questions")
                    g_session.current_question_index = final_state.get("current_question_index", 0)
                    g_session.readiness_score = final_state.get("readiness_score")
                await g_db.commit()
                await g_db.refresh(g_session)

                # Build response payload
                payload = {
                    "session_id": session_id,
                    "step": final_state.get("step"),
                    "readiness_score": final_state.get("readiness_score"),
                    "weak_areas": final_state.get("weak_areas"),
                    "study_plan": final_state.get("study_plan"),
                    "mock_questions": final_state.get("mock_questions"),
                    "current_question_index": final_state.get("current_question_index"),
                    "rag_count": len(final_state.get("rag_documents") or []),
                    "resume_analysis": final_state.get("resume_analysis"),
                    "completed_tasks": g_session.completed_tasks,
                }

                # Get AI message from state
                messages = final_state.get("messages", [])
                from langchain_core.messages import AIMessage
                ai_msgs = [m for m in messages if isinstance(m, AIMessage)]
                if ai_msgs:
                    payload["assistant_message"] = ai_msgs[-1].content
                    if not req.workflow_only:
                        g_db.add(ChatMessage(
                            session_id=session_id,
                            role="assistant",
                            content=ai_msgs[-1].content,
                        ))
                        await g_db.commit()

                yield f"data: {json.dumps(payload)}\n\n"

            except Exception as e:
                import traceback
                print(f"[ERROR] Exception in event_stream: {str(e)}")
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/session/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).where(DBSession.id == session_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": s.id,
        "company": s.company,
        "role": s.role,
        "timeline_days": s.timeline_days,
        "readiness_score": s.readiness_score,
        "weak_areas": s.weak_areas,
        "study_plan": s.study_plan,
        "mock_questions": s.mock_questions,
        "current_question_index": s.current_question_index,
        "completed_tasks": s.completed_tasks,
        "status": s.status,
        "time_taken": s.time_taken,
        "final_score": s.final_score,
        "accuracy": s.accuracy,
        "interviewer_persona": getattr(s, "interviewer_persona", "Standard Recruiter"),
    }


@router.get("/session/{session_id}/messages")
async def get_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    msgs = result.scalars().all()
    return [{"role": m.role, "content": m.content} for m in msgs]
