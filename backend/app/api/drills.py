import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

router = APIRouter()

class DrillRequest(BaseModel):
    topic: str
    company: str = "General"
    role: str = "Software Engineer"

@router.post("")
async def generate_drills(req: DrillRequest):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(500, "GROQ_API_KEY is not configured")

    try:
        llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3, max_tokens=1500)
        
        system_prompt = """You are an expert technical interviewer and computer science tutor.
You generate highly targeted flashcards and drill questions to help a candidate fix their specific weak area.

Rules:
1. Generate exactly 3 drill questions.
2. The questions must be highly specific to the given topic.
3. For each question, provide a detailed answer and a useful hint.
4. Output MUST be valid JSON in this exact format:
{
  "drills": [
    {
      "front": "The technical question or concept to explain",
      "back": "The detailed correct answer or explanation",
      "hint": "A short hint to guide them to the answer"
    }
  ]
}
5. Do NOT include markdown fences, just the raw JSON object."""

        user_prompt = f"Topic to drill: {req.topic}\nTarget Company: {req.company}\nTarget Role: {req.role}"

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        response = llm.invoke(messages)
        
        # Clean up possible markdown fences
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        data = json.loads(content.strip())
        
        return data

    except json.JSONDecodeError as e:
        raise HTTPException(500, f"Failed to parse LLM response: {str(e)}\nResponse: {response.content}")
    except Exception as e:
        raise HTTPException(500, str(e))
