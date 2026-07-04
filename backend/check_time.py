import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test():
    engine = create_async_engine(os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/prepagent'))
    async with engine.begin() as conn:
        res = await conn.execute(text('SELECT id, time_taken FROM sessions ORDER BY created_at DESC LIMIT 1;'))
        row = res.fetchone()
        print(row)

if __name__ == "__main__":
    asyncio.run(test())
