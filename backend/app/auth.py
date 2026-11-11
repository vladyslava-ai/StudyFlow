"""Cookie-based signed sessions and authenticated user dependency."""
import os
import secrets
from pathlib import Path
from fastapi import Cookie, Depends, HTTPException
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

KEY_FILE = Path(__file__).resolve().parent.parent / ".session_key"
if not KEY_FILE.exists():
    KEY_FILE.write_text(secrets.token_urlsafe(48), encoding="utf8")
try:
    KEY_FILE.chmod(0o600)
except OSError:
    pass
serializer = URLSafeTimedSerializer(os.environ.get("SESSION_SECRET") or KEY_FILE.read_text(encoding="utf8"), salt="studyflow-v2")

def current_user(studyflow_session: str | None = Cookie(default=None), db: Session = Depends(get_db)) -> User:
    if not studyflow_session:
        raise HTTPException(401, "Увійдіть до акаунта")
    try:
        uid = serializer.loads(studyflow_session, max_age=60 * 60 * 24 * 7)
        user = db.get(User, int(uid))
    except (BadSignature, SignatureExpired, ValueError, TypeError):
        user = None
    if user is None:
        raise HTTPException(401, "Сесія завершилася. Увійдіть знову")
    return user
