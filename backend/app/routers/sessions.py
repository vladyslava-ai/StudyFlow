from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import current_user
from ..models import StudySession, Subject, User
from ..schemas import ErrorOut, SessionIn, SessionOut

router = APIRouter(prefix="/api/sessions", tags=["Сесії навчання"])

NOT_FOUND = {404: {"model": ErrorOut, "description": "Сесію або предмет не знайдено"}}


def get_session_or_404(db: Session, session_id: int, user_id: int) -> StudySession:
    session = db.get(StudySession, session_id)
    if session is None or session.user_id != user_id:
        raise HTTPException(status_code=404, detail="Сесію не знайдено")
    return session


def ensure_subject_exists(db: Session, subject_id: int, user_id: int) -> None:
    if (subject := db.get(Subject, subject_id)) is None or subject.user_id != user_id:
        raise HTTPException(status_code=404, detail="Предмет не знайдено")


@router.get("", response_model=List[SessionOut], summary="Список сесій")
def list_sessions(
    subject_id: Optional[int] = Query(None, gt=0, description="Лише сесії цього предмета"),
    date_from: Optional[date] = Query(None, description="Від цієї дати включно"),
    date_to: Optional[date] = Query(None, description="До цієї дати включно"),
    limit: int = Query(100, ge=1, le=500, description="Скільки записів повернути"),
    offset: int = Query(0, ge=0, description="Скільки записів пропустити"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    """Повертає сесії від найновіших до найстаріших. Фільтри необов'язкові."""
    query = select(StudySession).where(StudySession.user_id == user.id)
    if subject_id is not None:
        query = query.where(StudySession.subject_id == subject_id)
    if date_from is not None:
        query = query.where(StudySession.studied_on >= date_from)
    if date_to is not None:
        query = query.where(StudySession.studied_on <= date_to)
    query = query.order_by(StudySession.studied_on.desc(), StudySession.id.desc())
    return db.scalars(query.limit(limit).offset(offset)).all()


@router.post(
    "",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
    responses=NOT_FOUND,
    summary="Додати сесію",
)
def create_session(data: SessionIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ensure_subject_exists(db, data.subject_id, user.id)
    session = StudySession(
        subject_id=data.subject_id,
        user_id=user.id,
        minutes=data.minutes,
        note=data.note,
        studied_on=data.studied_on,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionOut, responses=NOT_FOUND, summary="Отримати сесію")
def read_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return get_session_or_404(db, session_id, user.id)


@router.put("/{session_id}", response_model=SessionOut, responses=NOT_FOUND, summary="Оновити сесію")
def update_session(session_id: int, data: SessionIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    session = get_session_or_404(db, session_id, user.id)
    ensure_subject_exists(db, data.subject_id, user.id)
    session.subject_id = data.subject_id
    session.minutes = data.minutes
    session.note = data.note
    session.studied_on = data.studied_on
    db.commit()
    db.refresh(session)
    return session


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=NOT_FOUND,
    summary="Видалити сесію",
)
def delete_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    session = get_session_or_404(db, session_id, user.id)
    db.delete(session)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
