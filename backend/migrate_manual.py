import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def migrate():
    engine = create_async_engine(os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/prepagent'))
    try:
        async with engine.begin() as conn:
            print('Adding columns...')
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ACTIVE';"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS time_taken INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS accuracy FLOAT DEFAULT 0.0;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS final_score FLOAT DEFAULT 0.0;"))
            print('Columns added successfully!')
    except Exception as e:
        print('Error migrating:', e)

if __name__ == "__main__":
    asyncio.run(migrate())
