import asyncio
from sqlalchemy import select
from app.db.database import AsyncSessionLocal, Session as DBSession

async def run():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(DBSession))
        sessions = result.scalars().all()
        print(f"Total sessions: {len(sessions)}")
        for s in sessions:
            print(f"Session {s.id}: company={s.company}, readiness={s.readiness_score}, weak_areas={s.weak_areas}, study_plan={s.study_plan is not None}, questions={s.mock_questions is not None}")

if __name__ == "__main__":
    asyncio.run(run())
