from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt
import uuid
import os
import httpx

from app.db.database import get_db, User, Session as DBSession

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserUpdateProfile(BaseModel):
    name: str

class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str

class UserUpdatePreferences(BaseModel):
    preferences: Dict[str, Any]

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get current user
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    db_user = result.scalars().first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        id=str(uuid.uuid4()),
        email=user.email,
        name=user.name,
        hashed_password=get_password_hash(user.password),
        preferences={}
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "id": new_user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": new_user.id, "email": new_user.email, "name": new_user.name, "preferences": new_user.preferences}}


@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    db_user = result.scalars().first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "id": db_user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user.id, "email": db_user.email, "name": db_user.name, "preferences": db_user.preferences}}


@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name, "preferences": current_user.preferences}

@router.put("/me")
async def update_users_me(update_data: UserUpdateProfile, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user.name = update_data.name
    await db.commit()
    await db.refresh(current_user)
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name, "preferences": current_user.preferences}

@router.put("/password")
async def update_password(update_data: UserUpdatePassword, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.hashed_password == "OAUTH_USER":
        raise HTTPException(status_code=400, detail="Cannot change password for OAuth users.")
    
    if not verify_password(update_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(update_data.new_password)
    await db.commit()
    return {"status": "success", "message": "Password updated successfully"}

@router.put("/preferences")
async def update_preferences(update_data: UserUpdatePreferences, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Merge existing preferences with new ones
    current_prefs = current_user.preferences or {}
    for k, v in update_data.preferences.items():
        current_prefs[k] = v
    # Update dict completely to trigger sqlalchemy JSON change detection
    current_user.preferences = dict(current_prefs)
    
    await db.commit()
    await db.refresh(current_user)
    return {"preferences": current_user.preferences}

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
        raise HTTPException(400, "Only image files are supported")
        
    ext = file.filename.split(".")[-1]
    filename = f"{current_user.id}.{ext}"
    filepath = os.path.join("uploads", "avatars", filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
        
    avatar_url = f"http://localhost:8000/uploads/avatars/{filename}"
    
    current_prefs = current_user.preferences or {}
    current_prefs["avatar_url"] = avatar_url
    current_user.preferences = dict(current_prefs)
    
    await db.commit()
    await db.refresh(current_user)
    
    return {"avatar_url": avatar_url, "preferences": current_user.preferences}

@router.delete("/me")
async def delete_users_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Delete associated sessions first
    sessions_result = await db.execute(select(DBSession).where(DBSession.user_id == current_user.id))
    sessions = sessions_result.scalars().all()
    for s in sessions:
        await db.delete(s)
        
    await db.delete(current_user)
    await db.commit()
    return {"status": "success", "message": "Account deleted"}


@router.post("/google", response_model=Token)
async def google_auth(google_data: GoogleLogin, db: AsyncSession = Depends(get_db)):
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID", "dummy_client_id")
        
        # Verify the access token by calling Google's UserInfo API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {google_data.token}"}
            )
            if response.status_code != 200:
                raise ValueError("Invalid Google access token")
            idinfo = response.json()
            
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        result = await db.execute(select(User).where(User.email == email))
        db_user = result.scalars().first()
        
        if not db_user:
            db_user = User(
                id=str(uuid.uuid4()),
                email=email,
                name=name,
                hashed_password="OAUTH_USER", # No password for OAuth users
                preferences={}
            )
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.email, "id": db_user.id}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user.id, "email": db_user.email, "name": db_user.name, "preferences": db_user.preferences}}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
