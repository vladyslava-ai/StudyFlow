from datetime import date, timedelta


def make_subject(client, name="Python", goal=360):
    response = client.post("/api/subjects", json={"name": name, "goal_minutes": goal})
    assert response.status_code == 201
    return response.json()


def make_session(client, subject_id, minutes=45, days_ago=0, note=None):
    payload = {
        "subject_id": subject_id,
        "minutes": minutes,
        "studied_on": str(date.today() - timedelta(days=days_ago)),
    }
    if note is not None:
        payload["note"] = note
    response = client.post("/api/sessions", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_subject_crud(client):
    created = make_subject(client, "  SQL  ", 300)
    assert created["name"] == "SQL"  # пробіли обрізано
    assert created["id"] > 0

    assert client.get(f"/api/subjects/{created['id']}").json() == created
    assert client.get("/api/subjects").json() == [created]

    updated = client.put(f"/api/subjects/{created['id']}", json={"name": "SQL (PostgreSQL)", "goal_minutes": 360})
    assert updated.status_code == 200
    assert updated.json()["name"] == "SQL (PostgreSQL)"
    assert updated.json()["goal_minutes"] == 360

    assert client.delete(f"/api/subjects/{created['id']}").status_code == 204
    assert client.get(f"/api/subjects/{created['id']}").status_code == 404


def test_subject_validation(client):
    bad = [
        {"name": "", "goal_minutes": 120},
        {"name": "   ", "goal_minutes": 120},
        {"name": "x" * 61, "goal_minutes": 120},
        {"name": "Python", "goal_minutes": 5},
        {"name": "Python", "goal_minutes": 7000},
        {"goal_minutes": 120},
    ]
    for payload in bad:
        assert client.post("/api/subjects", json=payload).status_code == 422, payload


def test_not_found(client):
    assert client.get("/api/subjects/999").json() == {"detail": "Предмет не знайдено"}
    assert client.put("/api/subjects/999", json={"name": "A", "goal_minutes": 60}).status_code == 404
    assert client.delete("/api/subjects/999").status_code == 404
    assert client.get("/api/sessions/999").json() == {"detail": "Сесію не знайдено"}
    assert client.delete("/api/sessions/999").status_code == 404


def test_session_crud(client):
    subject = make_subject(client)
    created = make_session(client, subject["id"], 45, note="  Цикли  ")
    assert created["note"] == "Цикли"
    assert created["studied_on"] == str(date.today())

    assert client.get(f"/api/sessions/{created['id']}").json() == created

    updated = client.put(
        f"/api/sessions/{created['id']}",
        json={"subject_id": subject["id"], "minutes": 60, "note": None, "studied_on": created["studied_on"]},
    )
    assert updated.status_code == 200
    assert updated.json()["minutes"] == 60
    assert updated.json()["note"] is None

    assert client.delete(f"/api/sessions/{created['id']}").status_code == 204
    assert client.get(f"/api/sessions/{created['id']}").status_code == 404


def test_session_date_defaults_to_today(client):
    subject = make_subject(client)
    response = client.post("/api/sessions", json={"subject_id": subject["id"], "minutes": 30})
    assert response.status_code == 201
    assert response.json()["studied_on"] == str(date.today())


def test_session_validation(client):
    subject = make_subject(client)
    tomorrow = str(date.today() + timedelta(days=1))
    bad = [
        {"subject_id": subject["id"], "minutes": 0},
        {"subject_id": subject["id"], "minutes": 721},
        {"subject_id": subject["id"], "minutes": 30, "note": "x" * 201},
        {"subject_id": subject["id"], "minutes": 30, "studied_on": tomorrow},
        {"subject_id": subject["id"], "minutes": 30, "studied_on": "не дата"},
        {"minutes": 30},
    ]
    for payload in bad:
        assert client.post("/api/sessions", json=payload).status_code == 422, payload


def test_session_requires_existing_subject(client):
    response = client.post("/api/sessions", json={"subject_id": 12345, "minutes": 30})
    assert response.status_code == 404
    assert response.json() == {"detail": "Предмет не знайдено"}


def test_list_filters_and_order(client):
    python = make_subject(client, "Python")
    sql = make_subject(client, "SQL")
    make_session(client, python["id"], 30, days_ago=3)
    make_session(client, sql["id"], 40, days_ago=1)
    make_session(client, python["id"], 50, days_ago=0)

    everything = client.get("/api/sessions").json()
    assert [s["minutes"] for s in everything] == [50, 40, 30]  # від найновіших

    only_python = client.get("/api/sessions", params={"subject_id": python["id"]}).json()
    assert [s["minutes"] for s in only_python] == [50, 30]

    since = str(date.today() - timedelta(days=1))
    recent = client.get("/api/sessions", params={"date_from": since}).json()
    assert [s["minutes"] for s in recent] == [50, 40]

    page = client.get("/api/sessions", params={"limit": 1, "offset": 1}).json()
    assert [s["minutes"] for s in page] == [40]

    assert client.get("/api/sessions", params={"limit": 0}).status_code == 422


def test_deleting_subject_deletes_its_sessions(client):
    subject = make_subject(client)
    session = make_session(client, subject["id"])
    assert client.delete(f"/api/subjects/{subject['id']}").status_code == 204
    assert client.get(f"/api/sessions/{session['id']}").status_code == 404


def test_week_stats(client):
    python = make_subject(client, "Python", 60)
    sql = make_subject(client, "SQL", 300)
    make_subject(client, "Математика", 180)  # без сесій
    make_session(client, python["id"], 40, days_ago=0)
    make_session(client, python["id"], 30, days_ago=1)
    make_session(client, sql["id"], 20, days_ago=1)
    make_session(client, sql["id"], 90, days_ago=3)
    make_session(client, sql["id"], 500, days_ago=10)  # поза тижнем, не рахується

    stats = client.get("/api/stats/week").json()
    assert stats["total_minutes"] == 180
    assert stats["streak_days"] == 2  # сьогодні й учора, 2 дні тому порожньо
    assert len(stats["per_day"]) == 7
    assert stats["per_day"][-1] == {"date": str(date.today()), "minutes": 40}
    assert stats["per_day"][0]["date"] == str(date.today() - timedelta(days=6))

    by_name = {item["name"]: item for item in stats["per_subject"]}
    assert by_name["Python"]["minutes"] == 70
    assert by_name["Python"]["goal_reached"] is True
    assert by_name["SQL"]["minutes"] == 110
    assert by_name["SQL"]["goal_reached"] is False
    assert by_name["Математика"]["minutes"] == 0


def test_streak_counts_from_yesterday_when_today_is_empty(client):
    subject = make_subject(client)
    make_session(client, subject["id"], 30, days_ago=1)
    make_session(client, subject["id"], 30, days_ago=2)
    assert client.get("/api/stats/week").json()["streak_days"] == 2


def test_empty_database_stats(client):
    stats = client.get("/api/stats/week").json()
    assert stats["total_minutes"] == 0
    assert stats["streak_days"] == 0
    assert stats["per_subject"] == []


def test_openapi_is_available(client):
    spec = client.get("/openapi.json").json()
    assert spec["info"]["title"] == "Трекер навчання API"
    assert "/api/subjects/{subject_id}" in spec["paths"]
    assert "/api/stats/week" in spec["paths"]


def test_site_and_api_are_served_together(client):
    from pathlib import Path

    if not (Path(__file__).resolve().parent.parent / "static").is_dir():
        return  # сайт ще не зібрано, перевіряти нічого
    page = client.get("/")
    assert page.status_code == 200
    assert "text/html" in page.headers["content-type"]
    # статичний сайт не перекриває документацію й маршрути API
    assert client.get("/docs").status_code == 200
    assert client.get("/api/subjects").status_code == 200
    assert client.get("/api/health").status_code == 200
