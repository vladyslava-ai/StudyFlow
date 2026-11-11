import { formatTime, keyDaysAgo, pluralDays } from "../lib/time.js";
import AddSubjectForm from "./AddSubjectForm.jsx";

const QUICK_MINUTES = 30;

function SubjectRow({ subject, done, busy, onQuickAdd, onRemove }) {
  const met = done >= subject.goal_minutes;
  const percent = Math.min(100, (done / subject.goal_minutes) * 100);

  return (
    <li className={met ? "met" : undefined}>
      <span className="name">{subject.name}</span>
      <span className="amount">
        {formatTime(done)} з {formatTime(subject.goal_minutes)}
        {met ? ", ціль виконано" : ""}
      </span>
      <div className="row-actions">
        <button
          className="btn small"
          type="button"
          disabled={busy}
          onClick={() => onQuickAdd(subject.id)}
          aria-label={`Додати ${QUICK_MINUTES} хвилин до предмета ${subject.name}`}
        >
          +{QUICK_MINUTES} хв
        </button>
        <button
          className="btn small ghost quiet"
          type="button"
          disabled={busy}
          onClick={() => onRemove(subject)}
          aria-label={`Видалити предмет ${subject.name}`}
          title="Видалити предмет"
        >
          ✕
        </button>
      </div>
      <div
        className="meter"
        role="progressbar"
        aria-label={`${subject.name}, тижнева ціль`}
        aria-valuemin={0}
        aria-valuemax={subject.goal_minutes}
        aria-valuenow={Math.min(done, subject.goal_minutes)}
      >
        <i style={{ width: `${percent}%` }} />
      </div>
    </li>
  );
}

export default function Tracker({ tracker, stats }) {
  const { subjects, status, loadError, actionError, busy, reload, addSubject, removeSubject, addSession } = tracker;

  function quickAdd(subjectId) {
    addSession({ subjectId, minutes: QUICK_MINUTES, note: "", studiedOn: keyDaysAgo(0) });
  }

  function remove(subject) {
    if (window.confirm(`Видалити предмет «${subject.name}» разом з усіма його сесіями?`)) {
      removeSubject(subject.id);
    }
  }

  return (
    <section className="tracker" id="tracker" aria-labelledby="tr-title">
      <h2 id="tr-title">Останні 7 днів</h2>
      <p className="source">Дані надходять із власного сервера (REST API) і зберігаються в базі PostgreSQL.</p>

      {status === "loading" && <p className="state" role="status">Завантажую дані…</p>}

      {status === "error" && (
        <div className="state error-box" role="alert">
          <p>Не вдалося завантажити дані: {loadError}</p>
          <button className="btn small" type="button" onClick={reload}>Спробувати ще раз</button>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="total">
            <strong aria-live="polite">{formatTime(stats.total)}</strong>
            <span>навчання за тиждень</span>
          </div>
          <p className="streak">
            {stats.streak
              ? `${stats.streak} ${pluralDays(stats.streak)} поспіль`
              : "Серія почнеться з першої сесії"}
          </p>

          {subjects.length === 0 ? (
            <p className="state">Предметів ще немає. Додайте перший нижче, і тут з'явиться його прогрес.</p>
          ) : (
            <ul className="subjects" aria-label="Предмети й тижневі цілі">
              {subjects.map((subject) => (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                  done={stats.perSubject[subject.id] || 0}
                  busy={busy}
                  onQuickAdd={quickAdd}
                  onRemove={remove}
                />
              ))}
            </ul>
          )}

          {actionError && <p className="error" role="alert">{actionError}</p>}
          <AddSubjectForm onAdd={addSubject} busy={busy} />
        </>
      )}
    </section>
  );
}
