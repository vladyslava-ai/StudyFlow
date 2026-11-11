"""Підключення до бази даних PostgreSQL (Supabase) через SQLAlchemy."""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()


def normalize_url(url: str) -> str:
    # Supabase дає рядок postgresql://..., а SQLAlchemy із драйвером psycopg
    # очікує postgresql+psycopg://
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "Не задано DATABASE_URL. Скопіюйте .env.example у .env "
        "і вставте рядок підключення з Supabase."
    )

DATABASE_URL = normalize_url(DATABASE_URL)
is_sqlite = DATABASE_URL.startswith("sqlite")

# SQLite використовується лише в автоматичних тестах
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)

if is_sqlite:

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, _record):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Залежність FastAPI: відкриває сесію бази для запиту й закриває після нього."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
