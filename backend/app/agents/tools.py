"""Agent tools powered by OpenAI / Gemini via LangChain"""
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Optional
import json, re

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.4)

def robust_parse_json(content: str, default: any) -> any:
    try:
        cleaned = re.sub(r"```(?:json)?|```", "", content).strip()
        return json.loads(cleaned)
    except Exception:
        pass
    
    try:
        start_dict = content.find("{")
        start_list = content.find("[")
        if start_dict != -1 and start_list != -1:
            start = min(start_dict, start_list)
        else:
            start = max(start_dict, start_list)
            
        end_dict = content.rfind("}")
        end_list = content.rfind("]")
        end = max(end_dict, end_list)
        
        if start != -1 and end != -1:
            return json.loads(content[start:end+1])
    except Exception:
        pass
        
    return default

async def parse_resume_tool(resume_text: str) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract resume info as JSON with keys: projects (list), internships (list), skills (list), education (list), gaps (list of missing/weak areas). Return ONLY valid JSON."),
        ("human", "{resume}")
    ])
    chain = prompt | llm
    result = await chain.ainvoke({"resume": resume_text})
    return robust_parse_json(result.content, {"projects": [], "internships": [], "skills": [], "education": [], "gaps": []})


async def identify_weak_areas_tool(resume_analysis: dict, rag_docs: List[dict], company: str) -> List[str]:
    topics_from_rag = [d.get("topics", []) for d in rag_docs]
    flat_topics = list(set(t for sub in topics_from_rag for t in sub))

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a placement expert. Given a resume analysis and topics commonly tested at {company},
identify 4-6 weak areas the candidate needs to focus on. Return a JSON array of strings only."""),
        ("human", "Resume skills: {skills}\nCommon interview topics at {company}: {topics}")
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "company": company,
        "skills": json.dumps(resume_analysis.get("skills", [])),
        "topics": json.dumps(flat_topics[:20])
    })
    
    parsed = robust_parse_json(result.content, ["Dynamic Programming", "System Design", "Behavioral (STAR)", "OS Concepts"])
    if isinstance(parsed, dict) and "weak_areas" in parsed:
        parsed = parsed["weak_areas"]
    if not isinstance(parsed, list):
        parsed = [str(parsed)]
    return parsed


async def generate_study_plan_tool(weak_areas: List[str], timeline_days: int, company: str) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Create a {days}-day study plan for a {company} interview.
Weak areas: {weak_areas}
Return JSON: {{phases: [{{name, days, tasks: [{{name: string, duration_mins: int}}]}}], daily_hours, resources: [string]}}
Return ONLY valid JSON."""),
        ("human", "Build the plan.")
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "days": timeline_days,
        "company": company,
        "weak_areas": ", ".join(weak_areas)
    })
    return robust_parse_json(result.content, {
        "phases": [{"name": "Basics", "days": timeline_days, "tasks": [{"name": "Review algorithms", "duration_mins": 45}]}],
        "daily_hours": 2,
        "resources": ["LeetCode", "System Design Primer"]
    })


async def generate_mock_questions_tool(
    weak_areas: List[str], rag_docs: List[dict], company: str, count: int = 10
) -> List[dict]:
    past_questions = []
    for doc in rag_docs:
        content = doc.get("text", doc.get("content", doc.get("experience", doc.get("page_content", ""))))
        if content:
            past_questions.append(str(content))
    past_questions_context = "\n---\n".join(past_questions[:5])

    prompt = ChatPromptTemplate.from_messages([
        ("system", """Generate {count} interview questions for {company}.
Cover: DSA, System Design, and Behavioral.
Focus on weak areas: {weak_areas}

IMPORTANT: We have retrieved the following REAL previous year interview experiences and questions for {company} directly from the web and our database:
{past_questions_context}

You MUST prioritize using the exact real questions provided in the context above. Do not invent, guess, or fabricate questions unless the context is completely empty or insufficient.
Return JSON array: [{{id, type, difficulty, question, hint, expected_topics: [string]}}]
Return ONLY valid JSON."""),
        ("human", "Generate questions.")
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "count": count,
        "company": company,
        "weak_areas": ", ".join(weak_areas),
        "past_questions_context": past_questions_context if past_questions_context else "No past questions available."
    })
    parsed = robust_parse_json(result.content, [])
    if isinstance(parsed, dict) and "questions" in parsed:
        parsed = parsed["questions"]
    if not isinstance(parsed, list):
        parsed = [
            {
                "id": "q1", "type": "DSA", "difficulty": "Medium",
                "question": "Given a weighted graph, find shortest path from source to all nodes.",
                "hint": "Think Dijkstra's algorithm",
                "expected_topics": ["graphs", "priority queue", "dynamic programming"]
            }
        ]
    return parsed


async def evaluate_answer_tool(
    question: dict, 
    answer: str, 
    company: str, 
    history: List[str] = None, 
    interviewer_persona: str = "Standard Recruiter"
) -> dict:
    history_str = "\n".join(history) if history else "No previous turns."
    
    # Persona descriptions
    persona_instructions = ""
    if interviewer_persona == "Tough Tech Lead":
        persona_instructions = "You are a very critical, dry, and demanding Tech Lead. You point out edge cases, code efficiency, time/space complexity, and flaws. Your feedback is blunt, direct, and minimalist."
    elif interviewer_persona == "Encouraging Mentor":
        persona_instructions = "You are a friendly, encouraging Mentor. You guide the candidate with helpful hints, point out what they did well, and gently nudge them towards the optimal solution."
    else:  # Standard Recruiter / Standard Persona
        persona_instructions = "You are a professional HR/Recruiter. You focus on structured communication (STAR method), high-level logical consistency, behavioral details, and core logic."

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a senior {company} interviewer.
{persona_instructions}

You can either ask a follow-up question to probe deeper (e.g., if trade-offs, edge cases, or complexity are missing), or finalize the evaluation.
If the candidate has already answered a follow-up, or the response is comprehensive, finalize it.

Question: {question}
Expected topics: {expected}
Previous turns history:
{history_str}

Evaluate the latest answer and return JSON:
{{
  "is_followup": bool,
  "score_delta": int (-5 to +15, 0 if is_followup is true),
  "score_label": "Excellent" | "Good" | "Average" | "Weak" (empty if is_followup is true),
  "feedback": "Your follow-up question string" if is_followup is true, else "Final evaluation summary",
  "strengths": [string] (empty if is_followup is true),
  "improvements": [string] (empty if is_followup is true)
}}
Return ONLY valid JSON."""),
        ("human", "Candidate's latest answer: {answer}")
    ])
    chain = prompt | llm
    result = await chain.ainvoke({
        "company": company,
        "persona_instructions": persona_instructions,
        "question": question.get("question", ""),
        "expected": ", ".join(question.get("expected_topics", [])),
        "history_str": history_str,
        "answer": answer
    })
    return robust_parse_json(result.content, {
        "is_followup": False,
        "score_delta": 5,
        "score_label": "Good",
        "feedback": "Your answer covered the key points. Work on adding more technical depth.",
        "strengths": ["Clear structure"],
        "improvements": ["Add time complexity analysis"]
    })
