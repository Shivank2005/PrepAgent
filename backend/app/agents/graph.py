"""
LangGraph Agent DAG - 6-node placement prep workflow
Nodes: resume_analysis → rag_retrieval → weak_area_scan → study_plan → mock_questions → eval_engine
"""
from typing import TypedDict, Annotated, List, Optional
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from app.rag.retriever import retrieve_interview_experiences
from app.agents.tools import (
    parse_resume_tool,
    identify_weak_areas_tool,
    generate_study_plan_tool,
    generate_mock_questions_tool,
    evaluate_answer_tool,
)
import json


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    company: str
    role: Optional[str]
    timeline_days: int
    resume_text: Optional[str]
    resume_analysis: Optional[dict]
    rag_documents: Optional[List[dict]]
    weak_areas: Optional[List[str]]
    study_plan: Optional[dict]
    mock_questions: Optional[List[dict]]
    current_question_index: int
    readiness_score: Optional[float]
    session_id: str
    step: str
    evaluation_feedback: Optional[dict]
    interviewer_persona: Optional[str]



llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3)


# ──────────────────────────────────────────────
# NODE 1: Resume Analysis
# ──────────────────────────────────────────────
async def resume_analysis_node(state: AgentState) -> AgentState:
    resume_text = state.get("resume_text", "")
    if not resume_text:
        analysis = {
            "projects": [],
            "internships": [],
            "skills": [],
            "education": [],
            "gaps": ["No resume uploaded — using default skill profile"],
        }
    else:
        result = await parse_resume_tool(resume_text)
        analysis = result

    return {
        **state,
        "resume_analysis": analysis,
        "step": "rag_retrieval",
    }


# ──────────────────────────────────────────────
# NODE 2: RAG Retrieval (ChromaDB)
# ──────────────────────────────────────────────
async def rag_retrieval_node(state: AgentState) -> AgentState:
    company = state["company"]
    role = state.get("role", "Software Engineer")
    docs = await retrieve_interview_experiences(company=company, role=role, top_k=10)
    return {
        **state,
        "rag_documents": docs,
        "step": "weak_area_scan",
    }


# ──────────────────────────────────────────────
# NODE 3: Weak Area Identification
# ──────────────────────────────────────────────
async def weak_area_scan_node(state: AgentState) -> AgentState:
    resume_analysis = state.get("resume_analysis", {})
    rag_docs = state.get("rag_documents", [])
    company = state["company"]

    weak_areas = await identify_weak_areas_tool(
        resume_analysis=resume_analysis,
        rag_docs=rag_docs,
        company=company,
    )

    # Estimate readiness score (0–100)
    score = 40 + min(len(resume_analysis.get("projects", [])) * 5, 20)
    score = min(score, 75)

    return {
        **state,
        "weak_areas": weak_areas,
        "readiness_score": score,
        "step": "study_plan",
    }


# ──────────────────────────────────────────────
# NODE 4: Study Plan Generation
# ──────────────────────────────────────────────
async def study_plan_node(state: AgentState) -> AgentState:
    weak_areas = state.get("weak_areas", [])
    timeline_days = state.get("timeline_days", 14)
    company = state["company"]

    plan = await generate_study_plan_tool(
        weak_areas=weak_areas,
        timeline_days=timeline_days,
        company=company,
    )
    return {
        **state,
        "study_plan": plan,
        "step": "mock_questions",
    }


# ──────────────────────────────────────────────
# NODE 5: Mock Question Generation
# ──────────────────────────────────────────────
async def mock_questions_node(state: AgentState) -> AgentState:
    weak_areas = state.get("weak_areas", [])
    rag_docs = state.get("rag_documents")
    company = state["company"]
    role = state.get("role", "Software Engineer")
    
    if not rag_docs:
        from app.rag.retriever import retrieve_interview_experiences
        rag_docs = await retrieve_interview_experiences(company=company, role=role, top_k=10)

    questions = await generate_mock_questions_tool(
        weak_areas=weak_areas,
        rag_docs=rag_docs,
        company=company,
        count=10,
    )
    return {
        **state,
        "rag_documents": rag_docs,
        "mock_questions": questions,
        "current_question_index": 0,
        "step": "done",  # End here, wait for human to answer first question
    }


# ──────────────────────────────────────────────
# NODE 6: Answer Evaluation
# ──────────────────────────────────────────────
async def eval_engine_node(state: AgentState) -> AgentState:
    messages = state["messages"]
    last_human = next(
        (m.content for m in reversed(messages) if isinstance(m, HumanMessage)), ""
    )
    questions = state.get("mock_questions", [])
    idx = state.get("current_question_index", 0)
    current_q = questions[idx] if idx < len(questions) else None

    if not current_q:
        return {**state, "step": "done"}

    history = []
    for m in messages[-7:-1]:
        role = "Candidate" if isinstance(m, HumanMessage) else "Interviewer"
        history.append(f"{role}: {m.content}")

    feedback = await evaluate_answer_tool(
        question=current_q,
        answer=last_human,
        company=state["company"],
        history=history,
        interviewer_persona=state.get("interviewer_persona", "Standard Recruiter"),
    )

    # Update readiness score based on answer quality
    score = state.get("readiness_score", 50)
    score = min(100, score + feedback.get("score_delta", 0))

    is_followup = feedback.get("is_followup", False)
    next_idx = idx + 1
    ai_response = AIMessage(content=feedback["feedback"])

    return {
        **state,
        "messages": [ai_response],
        "readiness_score": score,
        "current_question_index": next_idx,
        "evaluation_feedback": feedback,
        "step": "eval_ready" if next_idx < len(questions) else "done",
    }


# ──────────────────────────────────────────────
# ROUTER: decide which node runs next
# ──────────────────────────────────────────────
def route_next(state: AgentState) -> str:
    return state.get("step", END)


# ──────────────────────────────────────────────
# BUILD THE GRAPH
# ──────────────────────────────────────────────
def build_agent_graph():
    graph = StateGraph(AgentState)

    graph.add_node("node_resume_analysis", resume_analysis_node)
    graph.add_node("node_rag_retrieval", rag_retrieval_node)
    graph.add_node("node_weak_area_scan", weak_area_scan_node)
    graph.add_node("node_study_plan", study_plan_node)
    graph.add_node("node_mock_questions", mock_questions_node)
    graph.add_node("node_eval_engine", eval_engine_node)

    graph.set_entry_point("node_resume_analysis")

    graph.add_edge("node_resume_analysis", "node_rag_retrieval")
    graph.add_edge("node_rag_retrieval", "node_weak_area_scan")
    graph.add_edge("node_weak_area_scan", "node_study_plan")
    graph.add_edge("node_study_plan", "node_mock_questions")

    graph.add_conditional_edges(
        "node_mock_questions",
        route_next,
        {
            "eval_ready": "node_eval_engine",
            "done": END,
        },
    )

    graph.add_conditional_edges(
        "node_eval_engine",
        route_next,
        {
            "eval_ready": END,  # wait for next human message (will re-enter at eval_engine on next request)
            "done": END,
        },
    )

    return graph.compile()


# ──────────────────────────────────────────────
# INVOKE GRAPH WITH DYNAMIC ENTRY POINT
# ──────────────────────────────────────────────
async def invoke_agent(state: AgentState):
    graph = build_agent_graph()
    step = state.get("step", "resume_analysis")
    
    # Map step names to node names
    entry_points = {
        "resume_analysis": "node_resume_analysis",
        "rag_retrieval": "node_rag_retrieval",
        "weak_area_scan": "node_weak_area_scan",
        "study_plan": "node_study_plan",
        "mock_questions": "node_mock_questions",
        "eval_engine": "node_eval_engine",
    }
    
    entry_point = entry_points.get(step, "node_resume_analysis")
    
    # For eval_engine, we need to invoke just that node
    if step == "eval_engine":
        return await eval_engine_node(state)
    
    # Otherwise, run the full graph from the appropriate entry point
    config = {"configurable": {"entry_point": entry_point}}
    return await graph.ainvoke(state, config)


agent_graph = build_agent_graph()
