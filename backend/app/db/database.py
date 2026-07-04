from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import Column, String, Integer, Float, JSON, Text, DateTime, func
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/prepagent"
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True)
    user_id = Column(String, index=True, nullable=True) # Optional for now to avoid breaking existing anonymous sessions
    company = Column(String)
    role = Column(String)
    timeline_days = Column(Integer)
    readiness_score = Column(Float)
    weak_areas = Column(JSON)
    study_plan = Column(JSON)
    mock_questions = Column(JSON)
    current_question_index = Column(Integer, default=0)
    resume_analysis = Column(JSON)
    completed_tasks = Column(JSON, default=dict)
    status = Column(String, default="ACTIVE")
    time_taken = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, index=True)
    role = Column(String)  # user | assistant
    content = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Migrate completed_tasks, user_id, and new session state columns if they don't exist
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS completed_tasks JSON DEFAULT '{}'::json;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id VARCHAR;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ACTIVE';"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS time_taken INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS accuracy FLOAT DEFAULT 0.0;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS final_score FLOAT DEFAULT 0.0;"))
        except Exception as e:
            print(f"Migration error (tolerable if db is fresh): {e}")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
