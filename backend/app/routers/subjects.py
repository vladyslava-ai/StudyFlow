from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import current_user
from ..models import Subject, User
from ..schemas import ErrorOut, SubjectIn, SubjectOut

router = APIRouter(prefix="/api/subjects", tags=["Предмети"])

NOT_FOUND = {404: {"model": ErrorOut, "description": "Предмет не знайдено"}}


def get_subject_or_404(db: Session, subject_id: int, user_id: int) -> Subject:
    subject = db.get(Subject, subject_id)
    if subject is None or subject.user_id != user_id:
        raise HTTPException(status_code=404, detail="Предмет не знайдено")
    return subject


@router.get("", response_model=List[SubjectOut], summary="Список предметів")
def list_subjects(db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Повертає всі предмети в порядку створення."""
    return db.scalars(select(Subject).where(Subject.user_id == user.id).order_by(Subject.id)).all()


@router.post(
    "",
    response_model=SubjectOut,
    status_code=status.HTTP_201_CREATED,
    summary="Створити предмет",
)
def create_subject(data: SubjectIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    subject = Subject(name=data.name, goal_minutes=data.goal_minutes, user_id=user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/{subject_id}", response_model=SubjectOut, responses=NOT_FOUND, summary="Отримати предмет")
def read_subject(subject_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return get_subject_or_404(db, subject_id, user.id)


@router.put("/{subject_id}", response_model=SubjectOut, responses=NOT_FOUND, summary="Оновити предмет")
def update_subject(subject_id: int, data: SubjectIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Замінює назву й тижневу ціль предмета."""
    subject = get_subject_or_404(db, subject_id, user.id)
    subject.name = data.name
    subject.goal_minutes = data.goal_minutes
    db.commit()
    db.refresh(subject)
    return subject


@router.delete(
    "/{subject_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=NOT_FOUND,
    summary="Видалити предмет",
)
def delete_subject(subject_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Видаляє предмет разом з усіма його сесіями навчання."""
    subject = get_subject_or_404(db, subject_id, user.id)
    db.delete(subject)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
