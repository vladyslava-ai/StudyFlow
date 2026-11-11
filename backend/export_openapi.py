"""Зберігає OpenAPI-специфікацію у файли openapi.json і openapi.yaml.

Запуск з папки backend:  python export_openapi.py
Базу даних для цього запускати не потрібно.
"""

import json
import os
import sys
from pathlib import Path

import yaml

# Для експорту підключення до бази не потрібне, тому підставляємо тимчасову SQLite-адресу
os.environ.setdefault("DATABASE_URL", "sqlite:///./openapi_export.db")

from app.main import app  # noqa: E402

spec = app.openapi()
root = Path(__file__).resolve().parent.parent

(root / "openapi.json").write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
(root / "openapi.yaml").write_text(
    yaml.safe_dump(spec, allow_unicode=True, sort_keys=False), encoding="utf-8"
)

leftover = Path("openapi_export.db")
if leftover.exists():
    leftover.unlink()

print("Збережено:", root / "openapi.json", "і", root / "openapi.yaml")
sys.exit(0)
