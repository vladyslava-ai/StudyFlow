"""One-time manual migration of unowned lab3 data to a selected registered account.
Usage: python claim_legacy.py you@example.com
"""
import sys
from sqlalchemy import select, func, update
from app.database import SessionLocal
from app.models import User, Subject, StudySession, Task

if len(sys.argv) != 2:
    raise SystemExit('Вкажіть email зареєстрованого акаунта: python claim_legacy.py email@example.com')
with SessionLocal() as db:
    user = db.scalar(select(User).where(User.email == sys.argv[1].strip().lower()))
    if not user: raise SystemExit('Спочатку зареєструйте цей email на сайті')
    tables = [Subject, StudySession, Task]
    counts = [db.scalar(select(func.count()).select_from(model).where(model.user_id.is_(None))) for model in tables]
    print(f'До акаунта {user.email} можна перенести: {counts[0]} предметів, {counts[1]} занять, {counts[2]} завдань.')
    if input('Підтвердити перенесення? Напишіть ТАК: ').strip() != 'ТАК':
        raise SystemExit('Скасовано')
    for model in tables:
        db.execute(update(model).where(model.user_id.is_(None)).values(user_id=user.id))
    db.commit()
    print('Готово! Старі дані тепер прив’язані до акаунта.')
