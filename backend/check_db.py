import asyncio
import os
import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def t():
    e = create_async_engine(os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/prepagent'))
    async with e.begin() as c:
        r = await c.execute(text('SELECT mock_questions FROM sessions ORDER BY created_at DESC LIMIT 2'))
        rows = r.fetchall()
        if rows:
            print(json.dumps([row[0] for row in rows][:2]))
        else:
            print('None')

asyncio.run(t())
