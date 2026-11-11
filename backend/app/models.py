"""Моделі таблиць. Вони збігаються зі структурою з lab2/supabase/schema.sql."""

from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# У PostgreSQL ключі мають тип bigint; для тестів на SQLite потрібен Integer
ID = BigInteger().with_variant(Integer, "sqlite")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(ID, ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    goal_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Видалення сесій разом із предметом виконує сама база (on delete cascade)
    sessions: Mapped[List["StudySession"]] = relationship(
        back_populates="subject", cascade="all, delete-orphan", passive_deletes=True
    )


class StudySession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(ID, ForeignKey("users.id"), nullable=True)
    subject_id: Mapped[int] = mapped_column(
        ID, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text)
    studied_on: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    subject: Mapped[Subject] = relationship(back_populates="sessions")


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(ID, ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(Text, nullable=False, default="medium")
    status: Mapped[str] = mapped_column(Text, nullable=False, default="planned")
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    display_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
