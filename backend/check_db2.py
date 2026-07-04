import asyncio, json
from app.db.database import AsyncSessionLocal, Session as DBSession
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(DBSession).order_by(DBSession.created_at.desc()).limit(1))
        s = res.scalar_one_or_none()
        print(json.dumps({'time_taken': s.time_taken, 'final_score': s.final_score, 'status': s.status} if s else 'none'))

asyncio.run(check())
