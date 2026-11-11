import { useState } from "react";
import { dateLabel, formatTime, keyDaysAgo } from "../lib/time.js";

function SessionForm({ subjects, onAdd, busy }) {
  const today = keyDaysAgo(0);
  const [subjectId, setSubjectId] = useState("");
  const [minutes, setMinutes] = useState("45");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const selected = subjectId || (subjects[0] ? String(subjects[0].id) : "");

  async function handleSubmit(event) {
    event.preventDefault();
    const amount = Number(minutes);

    if (!selected) return setError("Спершу додайте предмет у трекері.");
    if (!Number.isInteger(amount) || amount < 1 || amount > 720) {
      return setError("Тривалість має бути цілим числом хвилин від 1 до 720.");
    }
    if (date < keyDaysAgo(6) || date > today) return setError("Виберіть дату за останні 7 днів.");
    if (note.length > 200) return setError("Нотатка має бути не довшою за 200 символів.");

    setError("");
    const ok = await onAdd({
      subjectId: Number(selected),
      minutes: amount,
      note: note.trim(),
      studiedOn: date,
    });
    if (ok) {
      setNote("");
      setMinutes("45");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="session-subject">Предмет</label>
        <select id="session-subject" value={selected} onChange={(e) => setSubjectId(e.target.value)} disabled={!subjects.length}>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
      </div>
      <div className="form-pair">
        <div className="field">
          <label htmlFor="session-minutes">Тривалість, хв</label>
          <input
            id="session-minutes"
            type="number"
            inputMode="numeric"
            min="1"
            max="720"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="session-date">Дата</label>
          <input
            id="session-date"
            type="date"
            min={keyDaysAgo(6)}
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="session-note">Що вивчили</label>
        <input
          id="session-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Коротка нотатка, за бажанням"
          maxLength={200}
          autoComplete="off"
        />
      </div>
      <button className="btn" type="submit" disabled={busy || !subjects.length}>Зберегти сесію</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

export default function Journal({ tracker }) {
  const { subjects, sessions, status, busy, addSession, removeSession } = tracker;
  const names = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

  return (
    <section className="wrap block" id="journal" aria-labelledby="journal-title">
      <div className="section-head">
        <h2 id="journal-title">Журнал сесій</h2>
        <p>Записуйте кожне заняття: предмет, скільки часу й що вивчили. Список нижче показує сесії за останні сім днів, найновіші зверху.</p>
      </div>

      <div className="journal">
        <div className="journal-form">
          <h3>Нова сесія</h3>
          {status === "ready" ? (
            <SessionForm subjects={subjects} onAdd={addSession} busy={busy} />
          ) : (
            <p className="state">Форма з'явиться, коли завантажаться предмети.</p>
          )}
        </div>

        <div className="journal-list">
          <h3>За тиждень</h3>
          {status === "ready" && sessions.length === 0 && (
            <p className="state">Сесій за тиждень ще немає. Додайте першу, і вона з'явиться тут.</p>
          )}
          <ul className="sessions">
            {sessions.map((session) => (
              <li key={session.id}>
                <div className="session-main">
                  <span className="session-subject">{names[session.subject_id] || "Видалений предмет"}</span>
                  <span className="session-time">{formatTime(session.minutes)}</span>
                </div>
                <p className="session-meta">
                  {dateLabel(session.studied_on)}
                  {session.note ? ` — ${session.note}` : ""}
                </p>
                <button
                  className="btn small ghost quiet"
                  type="button"
                  disabled={busy}
                  onClick={() => removeSession(session.id)}
                  aria-label={`Видалити сесію: ${names[session.subject_id] || "предмет"}, ${formatTime(session.minutes)}`}
                  title="Видалити сесію"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
