"""Схеми Pydantic: описують, які дані приймає й повертає API, і перевіряють їх."""

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ErrorOut(BaseModel):
    detail: str = Field(..., examples=["Предмет не знайдено"])


# ---------- Предмети ----------

class SubjectIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=60, description="Назва предмета")
    goal_minutes: int = Field(..., ge=10, le=6000, description="Тижнева ціль у хвилинах")

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Назва не може бути порожньою")
        return value

    model_config = ConfigDict(
        json_schema_extra={"examples": [{"name": "Tableau", "goal_minutes": 120}]}
    )


class SubjectOut(SubjectIn):
    id: int = Field(..., examples=[1])

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={"examples": [{"id": 5, "name": "Tableau", "goal_minutes": 120}]},
    )


# ---------- Сесії навчання ----------

class SessionIn(BaseModel):
    subject_id: int = Field(..., gt=0, description="Ідентифікатор предмета")
    minutes: int = Field(..., ge=1, le=720, description="Тривалість у хвилинах")
    note: Optional[str] = Field(None, max_length=200, description="Що вивчили, за бажанням")
    studied_on: date = Field(default_factory=date.today, description="Дата заняття, за замовчуванням сьогодні")

    @field_validator("studied_on")
    @classmethod
    def not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Дата не може бути в майбутньому")
        return value

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"subject_id": 1, "minutes": 45, "note": "Цикли та функції", "studied_on": "2026-11-06"}
            ]
        }
    )


class SessionOut(BaseModel):
    id: int
    subject_id: int
    minutes: int
    note: Optional[str] = None
    studied_on: date

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {"id": 12, "subject_id": 1, "minutes": 45, "note": "Цикли та функції", "studied_on": "2026-11-06"}
            ]
        },
    )


# ---------- Статистика ----------

class DayStat(BaseModel):
    date: date
    minutes: int


class SubjectStat(BaseModel):
    subject_id: int
    name: str
    goal_minutes: int
    minutes: int
    goal_reached: bool


class WeekStats(BaseModel):
    total_minutes: int = Field(..., description="Скільки хвилин навчання за останні 7 днів")
    streak_days: int = Field(..., description="Скільки днів поспіль були заняття")
    per_day: List[DayStat] = Field(..., description="Хвилини за днями, від найстарішого до сьогодні")
    per_subject: List[SubjectStat] = Field(..., description="Прогрес по кожному предмету")
