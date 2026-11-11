import os
import sys
from pathlib import Path

# Тести працюють на тимчасовій базі SQLite, а не на Supabase
TEST_DB = Path(__file__).parent / "test_api.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestClient(app) as test_client:
        assert test_client.post("/api/auth/register", json={"email":"fixture@example.com","password":"test-password-123"}).status_code == 201
        yield test_client


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    if TEST_DB.exists():
        TEST_DB.unlink()
