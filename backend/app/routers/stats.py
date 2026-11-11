from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import current_user
from ..models import StudySession, Subject, User
from ..schemas import DayStat, SubjectStat, WeekStats

router = APIRouter(prefix="/api/stats", tags=["Статистика"])

DAYS = 7


@router.get("/week", response_model=WeekStats, summary="Підсумки за останні 7 днів")
def week_stats(db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Загальний час, серія днів поспіль, хвилини за днями та прогрес по предметах."""
    today = date.today()
    start = today - timedelta(days=DAYS - 1)

    # Хвилини за днями: групування по даті
    day_rows = db.execute(
        select(StudySession.studied_on, func.sum(StudySession.minutes))
        .where(StudySession.studied_on >= start, StudySession.studied_on <= today, StudySession.user_id == user.id)
        .group_by(StudySession.studied_on)
    ).all()
    minutes_by_day = {row[0]: int(row[1]) for row in day_rows}

    per_day = [
        DayStat(date=start + timedelta(days=i), minutes=minutes_by_day.get(start + timedelta(days=i), 0))
        for i in range(DAYS)
    ]

    # Хвилини за предметами: LEFT JOIN, щоб предмети без сесій теж потрапили у відповідь
    subject_rows = db.execute(
        select(
            Subject.id,
            Subject.name,
            Subject.goal_minutes,
            func.coalesce(func.sum(StudySession.minutes), 0),
        )
        .outerjoin(
            StudySession,
            and_(
                StudySession.subject_id == Subject.id,
                StudySession.studied_on >= start,
                StudySession.studied_on <= today,
                StudySession.user_id == user.id,
            ),
        )
        .where(Subject.user_id == user.id)
        .group_by(Subject.id, Subject.name, Subject.goal_minutes)
        .order_by(Subject.id)
    ).all()

    per_subject = [
        SubjectStat(
            subject_id=row[0],
            name=row[1],
            goal_minutes=row[2],
            minutes=int(row[3]),
            goal_reached=int(row[3]) >= row[2],
        )
        for row in subject_rows
    ]

    # Серія днів: якщо сьогодні ще немає занять, рахуємо від учорашнього дня
    by_age = [day.minutes for day in reversed(per_day)]  # [сьогодні, вчора, ...]
    streak = 0
    index = 0 if by_age[0] > 0 else 1
    while index < DAYS and by_age[index] > 0:
        streak += 1
        index += 1

    return WeekStats(
        total_minutes=sum(day.minutes for day in per_day),
        streak_days=streak,
        per_day=per_day,
        per_subject=per_subject,
    )
