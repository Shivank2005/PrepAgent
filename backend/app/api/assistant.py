import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.responses import StreamingResponse

from app.db.database import get_db, Session as DBSession
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: list = []

@router.post("/chat")
async def chat_with_assistant(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBSession).where(DBSession.id == req.session_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found")
        
    # Setup Groq LLM
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(500, "GROQ_API_KEY is not configured on the server.")
        
    from langchain_groq import ChatGroq
    llm = ChatGroq(
        api_key=groq_api_key,
        model_name="llama-3.1-8b-instant",
        streaming=True
    )
    # Initialize Pinecone Retrieval
    index_name = os.getenv("PINECONE_INDEX")
    retrieved_text = ""
    if index_name and os.getenv("PINECONE_API_KEY"):
        try:
            embeddings = OpenAIEmbeddings()
            vectorstore = PineconeVectorStore(index_name=index_name, embedding=embeddings)
            retriever = vectorstore.as_retriever(search_kwargs={"filter": {"session_id": req.session_id}, "k": 3})
            docs = retriever.invoke(req.message)
            retrieved_text = "\n\n".join([d.page_content for d in docs])
        except Exception as e:
            print(f"Pinecone retrieval failed: {e}")
            retrieved_text = ""

    # Always include baseline session context in case Pinecone is empty
    baseline_context = f"""
    Candidate Role: {s.role} at {s.company}
    Weak Areas: {s.weak_areas}
    Current Readiness Score: {s.readiness_score}
    """
    
    sys_msg = f"""You are the PrepAgent AI Study Assistant.
Your job is to help the candidate prepare for their upcoming {s.company} interview.
Answer their questions helpfully and concisely. Use formatting where appropriate.

Here is the baseline context about the user:
{baseline_context}

Here is retrieved contextual information from their study plan and past questions (if any):
{retrieved_text}

Use this context to tailor your advice. If they ask about something not in the context, you can still answer using your general knowledge."""

    messages = [SystemMessage(content=sys_msg)]
    for msg in req.history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg.get("content")))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg.get("content")))
            
    messages.append(HumanMessage(content=req.message))

    async def generate():
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield chunk.content

    return StreamingResponse(generate(), media_type="text/event-stream")
