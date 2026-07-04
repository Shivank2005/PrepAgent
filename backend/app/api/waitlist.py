from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

class WaitlistRequest(BaseModel):
    email: EmailStr

# Simple in-memory set for demo purposes. In production, this would use the db connection.
waitlist_db = set()

@router.post("/")
@limiter.limit("5/minute")
async def join_waitlist(request: Request, body: WaitlistRequest):
    if body.email in waitlist_db:
        return {"status": "success", "message": "You're already on the waitlist!"}
    
    waitlist_db.add(body.email)
    return {"status": "success", "message": "Added to waitlist successfully."}

@router.get("/stats")
async def get_stats():
    return {
        "users": 10245 + len(waitlist_db),
        "companies": 54,
        "offer_rate": 94
    }
