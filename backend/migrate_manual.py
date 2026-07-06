import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def migrate():
    db_url = os.getenv('DATABASE_URL')
    print(f"Migrating database at: {db_url}")
    engine = create_async_engine(db_url)
    try:
        async with engine.begin() as conn:
            print('Adding columns...')
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ACTIVE';"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS time_taken INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS accuracy FLOAT DEFAULT 0.0;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS final_score FLOAT DEFAULT 0.0;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS interviewer_persona VARCHAR DEFAULT 'Standard Recruiter';"))
            print('Columns added successfully!')
    except Exception as e:
        print('Error migrating:', e)

if __name__ == "__main__":
    asyncio.run(migrate())
