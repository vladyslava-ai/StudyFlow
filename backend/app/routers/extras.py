"""Tasks, calendar, profile, authentication and avatar upload for laboratory 4."""
import base64
import hashlib
import hmac
import re
import secrets
from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import current_user, serializer
from ..database import get_db
from ..models import Task, User, StudySession

router = APIRouter(prefix="/api", tags=["Акаунт і завдання"])

class TaskInput(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    priority: Literal["low", "medium", "high"] = "medium"
    status: Literal["planned", "progress", "done"] = "planned"
    due_date: date | None = None
    @field_validator("title")
    @classmethod
    def clean(cls, v):
        if not v.strip(): raise ValueError("Вкажіть назву завдання")
        return v.strip()

class TaskPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    priority: Literal["low", "medium", "high"] | None = None
    status: Literal["planned", "progress", "done"] | None = None
    due_date: date | None = None

class Credentials(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", v):
            raise ValueError("Некоректна адреса email")
        return v

class ProfileUpdate(BaseModel):
    display_name: str = Field(min_length=2, max_length=60)
    @field_validator("display_name")
    @classmethod
    def clean(cls, v):
        if len(v.strip()) < 2: raise ValueError("Ім'я занадто коротке")
        return v.strip()

class AvatarUpdate(BaseModel):
    image: str | None = Field(default=None, max_length=400000)

def user_out(user):
    return {"id": user.id, "email": user.email, "display_name": user.display_name or user.email.split("@")[0], "avatar_data": user.avatar_data}

def task_out(task):
    return {"id": task.id, "title": task.title, "priority": task.priority, "status": task.status, "due_date": task.due_date}

def hash_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310000)
    return base64.b64encode(salt).decode() + ":" + base64.b64encode(digest).decode()

def valid_password(password, stored):
    try:
        salt, expected = stored.split(":", 1)
        actual = hash_password(password, base64.b64decode(salt)).split(":", 1)[1]
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError): return False

def set_cookie(response, user):
    response.set_cookie("studyflow_session", serializer.dumps(str(user.id)), max_age=604800,
                        httponly=True, samesite="lax", secure=False, path="/")

@router.post("/auth/register", status_code=201)
def register(data: Credentials, response: Response, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(409, "Email уже зареєстровано")
    user = User(email=data.email, password_hash=hash_password(data.password), display_name=data.email.split('@')[0])
    db.add(user)
    try: db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Email уже зареєстровано")
    db.refresh(user)
    set_cookie(response, user)
    return user_out(user)

@router.post("/auth/login")
def login(data: Credentials, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    if not user or not valid_password(data.password, user.password_hash):
        raise HTTPException(401, "Невірний email або пароль")
    set_cookie(response, user)
    return user_out(user)

@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("studyflow_session", path="/")
    return {"ok": True}

@router.get("/auth/me")
def me(user: User = Depends(current_user)):
    return user_out(user)

@router.patch("/profile")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    user.display_name = data.display_name
    db.commit(); db.refresh(user)
    return user_out(user)

@router.put("/profile/avatar")
def update_avatar(data: AvatarUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if data.image is not None:
        match = re.fullmatch(r"data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})", data.image)
        if not match: raise HTTPException(422, "Підтримуються лише PNG, JPEG і WebP")
        try: raw = base64.b64decode(match.group(2), validate=True)
        except ValueError: raise HTTPException(422, "Некоректне фото")
        if len(raw) > 200000: raise HTTPException(413, "Фото має бути менше 200 КБ")
        if not (raw.startswith(b'\x89PNG\r\n\x1a\n') or raw.startswith(b'\xff\xd8\xff') or raw.startswith(b'RIFF') and raw[8:12] == b'WEBP'):
            raise HTTPException(422, "Файл не є зображенням")
    user.avatar_data = data.image
    db.commit(); db.refresh(user)
    return user_out(user)

@router.get("/tasks")
def list_tasks(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return [task_out(x) for x in db.scalars(select(Task).where(Task.user_id == user.id).order_by(Task.id.desc())).all()]

@router.post("/tasks", status_code=201)
def create_task(data: TaskInput, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = Task(**data.model_dump(), user_id=user.id)
    db.add(task); db.commit(); db.refresh(task)
    return task_out(task)

def own_task(db, task_id, user_id):
    task = db.get(Task, task_id)
    if not task or task.user_id != user_id: raise HTTPException(404, "Завдання не знайдено")
    return task

@router.patch("/tasks/{task_id}")
def update_task(task_id: int, data: TaskPatch, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = own_task(db, task_id, user.id)
    for key, value in data.model_dump(exclude_unset=True).items(): setattr(task, key, value)
    db.commit(); db.refresh(task)
    return task_out(task)

@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.delete(own_task(db, task_id, user.id)); db.commit()

@router.get("/calendar")
def calendar(days: int = 90, db: Session = Depends(get_db), user: User = Depends(current_user)):
    days = max(7, min(days, 366))
    start = date.today() - timedelta(days=days - 1)
    rows = db.execute(select(StudySession.studied_on, func.sum(StudySession.minutes)).where(
        StudySession.studied_on >= start, StudySession.user_id == user.id).group_by(StudySession.studied_on)).all()
    counts = {str(day): int(minutes) for day, minutes in rows}
    return [{"date": str(start + timedelta(days=i)), "minutes": counts.get(str(start + timedelta(days=i)), 0)} for i in range(days)]
