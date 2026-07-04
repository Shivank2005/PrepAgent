from fastapi import APIRouter, UploadFile, File, HTTPException
from app.agents.tools import parse_resume_tool
import pdfplumber, io

router = APIRouter()


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith((".pdf", ".txt")):
        raise HTTPException(400, "Only PDF and TXT files are supported")

    content = await file.read()
    text = ""

    if file.filename.endswith(".pdf"):
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                text = "\n".join(p.extract_text() or "" for p in pdf.pages)
        except Exception as e:
            raise HTTPException(500, f"PDF parse error: {e}")
    else:
        text = content.decode("utf-8", errors="ignore")

    if not text.strip():
        raise HTTPException(400, "Could not extract text from file")

    analysis = await parse_resume_tool(text)
    return {"resume_text": text, "analysis": analysis}
