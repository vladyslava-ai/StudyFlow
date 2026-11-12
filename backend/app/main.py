"""Точка входу: створює застосунок FastAPI і підключає маршрути."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .database import Base, engine
from .routers import sessions, stats, subjects, extras

DESCRIPTION = """
REST API трекера навчання. Зберігає предмети й сесії навчання в базі PostgreSQL
і віддає підсумки за останні 7 днів.

* **Предмети** містять назву й тижневу ціль у хвилинах.
* **Сесії навчання** належать предмету: тривалість, дата й коротка нотатка.
* **Статистика** рахує час за тиждень, серію днів поспіль і прогрес по предметах.

Дані передаються у форматі JSON. Помилки мають поле `detail` з поясненням.
"""

TAGS = [
    {"name": "Предмети", "description": "Створення, перегляд, зміна й видалення предметів"},
    {"name": "Сесії навчання", "description": "Записи про заняття: коли, скільки й що вивчили"},
    {"name": "Статистика", "description": "Підсумки за тиждень"},
    {"name": "Службові", "description": "Перевірка роботи сервера"},
]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Створює таблиці, якщо їх ще немає (у Supabase вони вже створені файлом schema.sql)
    Base.metadata.create_all(engine)
    # Safe additive migration: never drop existing user data.
    with engine.begin() as connection:
        for table, column, definition in [
            ("subjects", "user_id", "BIGINT"),
            ("sessions", "user_id", "BIGINT"),
            ("tasks", "user_id", "BIGINT"),
            ("users", "display_name", "TEXT"),
            ("users", "avatar_data", "TEXT"),
        ]:
            if engine.dialect.name == "postgresql":
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {definition}"))
            else:
                from sqlalchemy import inspect
                columns = {c["name"] for c in inspect(connection).get_columns(table)}
                if column not in columns:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
    yield


app = FastAPI(
    title="Трекер навчання API",
    description=DESCRIPTION,
    version="0.4.0",
    openapi_tags=TAGS,
    lifespan=lifespan,
)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(subjects.router)
app.include_router(sessions.router)
app.include_router(stats.router)
app.include_router(extras.router)


@app.get("/api/health", tags=["Службові"], summary="Стан сервера й бази даних")
def health():
    """Повертає 200, якщо сервер працює й база відповідає, і 503, якщо бази немає."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as error:
        raise HTTPException(status_code=503, detail="База даних недоступна") from error
    return {"status": "ok", "database": "ok"}


# Готовий сайт лежить у backend/static (збирається з папки frontend).
# Монтується останнім, щоб не перекривати /api та /docs.
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="site")
else:
    @app.get("/", include_in_schema=False)
    def root():
        return RedirectResponse(url="/docs")