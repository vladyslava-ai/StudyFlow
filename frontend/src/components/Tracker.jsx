
import { useState } from "react";
import { formatTime, pluralDays } from "../lib/time.js";
import AddSubjectForm from "./AddSubjectForm.jsx";

const COLORS = [
  { background: "#E8EEE5", accent: "#68856E" },
  { background: "#F4E8DE", accent: "#B88465" },
  { background: "#E8EAF4", accent: "#7A83B1" },
  { background: "#F4EBD9", accent: "#B49A60" },
  { background: "#E7EEF0", accent: "#7196A0" },
  { background: "#F0E6EC", accent: "#A47D98" },
];

function localToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function SubjectCard({
  subject,
  done,
  busy,
  color,
  onAddMinutes,
  onRemove,
}) {
  const [minutes, setMinutes] = useState("30");

  const goal = Math.max(0, Number(subject.goal_minutes) || 0);
  const completed = Math.max(0, Number(done) || 0);

  const percent =
    goal > 0
      ? Math.min(100, Math.round((completed / goal) * 100))
      : 0;

  const met = goal > 0 && completed >= goal;

  const addTime = () => {
    const value = Number(minutes);

    if (!Number.isInteger(value) || value < 1 || value > 1440) {
      return;
    }

    onAddMinutes(subject.id, value);
  };

  return (
    <li
      className="sf-subject-card"
      style={{
        backgroundColor: color.background,
        borderRadius: "20px",
        padding: "24px",
        listStyle: "none",
        border: "1px solid rgba(40, 60, 45, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "1.2px",
              color: color.accent,
            }}
          >
            НАВЧАЛЬНИЙ ПРЕДМЕТ
          </span>

          <h3
            style={{
              margin: "9px 0 0",
              fontSize: "21px",
              lineHeight: 1.3,
              color: "#253A33",
              overflowWrap: "anywhere",
            }}
          >
            {subject.name}
          </h3>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(subject)}
          aria-label={`Видалити предмет ${subject.name}`}
          title="Видалити предмет"
          style={{
            border: "none",
            background: "rgba(255,255,255,0.65)",
            color: "#53665A",
            borderRadius: "10px",
            width: "34px",
            height: "34px",
            cursor: busy ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          marginTop: "26px",
          flexWrap: "wrap",
        }}
      >
        <strong
          style={{
            fontSize: "27px",
            color: "#253A33",
          }}
        >
          {formatTime(completed)}
        </strong>

        <span style={{ color: "#52645A", fontSize: "13px" }}>
          із {formatTime(goal)}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "16px",
          marginBottom: "8px",
          color: "#43584E",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        <span>Тижневий прогрес</span>
        <span>{percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-label={`${subject.name}, тижнева ціль`}
        aria-valuemin={0}
        aria-valuemax={goal || 1}
        aria-valuenow={Math.min(completed, goal)}
        style={{
          width: "100%",
          height: "9px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.75)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: "20px",
            background: color.accent,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p
        style={{
          margin: "12px 0 20px",
          color: "#52645A",
          fontSize: "12px",
        }}
      >
        {met
          ? "✦ Тижневу ціль виконано!"
          : `Залишилося ${formatTime(Math.max(0, goal - completed))}`}
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "stretch",
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            color: "#43584E",
            fontSize: "12px",
            flex: "1 1 100px",
          }}
        >
          Хвилини

          <input
            type="number"
            min="1"
            max="1440"
            step="1"
            value={minutes}
            disabled={busy}
            onChange={(event) => setMinutes(event.target.value)}
            style={{
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              padding: "10px 12px",
              border: "1px solid #D5DDD4",
              borderRadius: "10px",
              background: "#FFFFFF",
              color: "#253A33",
              fontSize: "14px",
            }}
          />
        </label>

        <button
          type="button"
          disabled={
            busy ||
            !Number.isInteger(Number(minutes)) ||
            Number(minutes) < 1 ||
            Number(minutes) > 1440
          }
          onClick={addTime}
          style={{
            alignSelf: "flex-end",
            flex: "1 1 130px",
            padding: "11px 15px",
            background: color.accent,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          + Додати час
        </button>
      </div>
    </li>
  );
}

export default function Tracker({ tracker, stats }) {
  const {
    subjects,
    status,
    loadError,
    actionError,
    busy,
    reload,
    addSubject,
    removeSubject,
    addSession,
  } = tracker;

  function addMinutes(subjectId, minutes) {
    return addSession({
      subjectId,
      minutes,
      note: "",
      studiedOn: localToday(),
    });
  }

  function remove(subject) {
    if (
      window.confirm(
        `Видалити предмет «${subject.name}» разом з усіма його сесіями?`
      )
    ) {
      removeSubject(subject.id);
    }
  }

  return (
    <section
      className="tracker sf-subjects-page"
      id="tracker"
      aria-labelledby="tr-title"
    >
      <div style={{ marginBottom: "24px" }}>
        <h2
          id="tr-title"
          style={{
            fontSize: "22px",
            color: "var(--ink, #253A33)",
            marginBottom: "8px",
          }}
        >
          Мої навчальні предмети
        </h2>

        <p style={{ color: "var(--muted, #52645A)" }}>
          Відстежуй навчання, додавай час і досягай
          своїх тижневих цілей.
        </p>
      </div>

      {status === "loading" && (
        <p className="state" role="status">
          Завантажую дані…
        </p>
      )}

      {status === "error" && (
        <div className="state error-box" role="alert">
          <p>Не вдалося завантажити дані: {loadError}</p>

          <button
            className="btn small"
            type="button"
            onClick={reload}
          >
            Спробувати ще раз
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          <div
            className="sf-subjects-summary"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                flex: "1 1 180px",
                padding: "20px",
                background: "var(--panel, #FFFCF7)",
                border: "1px solid var(--line, #E6E0D5)",
                borderRadius: "16px",
              }}
            >
              <span
                style={{
                  display: "block",
                  color: "var(--muted, #52645A)",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                Навчання за 7 днів
              </span>

              <strong
                style={{
                  fontSize: "25px",
                  color: "var(--ink, #253A33)",
                }}
              >
                {formatTime(stats.total)}
              </strong>
            </div>

            <div
              style={{
                flex: "1 1 180px",
                padding: "20px",
                background: "var(--panel, #FFFCF7)",
                border: "1px solid var(--line, #E6E0D5)",
                borderRadius: "16px",
              }}
            >
              <span
                style={{
                  display: "block",
                  color: "var(--muted, #52645A)",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                Навчальних предметів
              </span>

              <strong
                style={{
                  fontSize: "25px",
                  color: "var(--ink, #253A33)",
                }}
              >
                {subjects.length}
              </strong>
            </div>

            <div
              style={{
                flex: "1 1 180px",
                padding: "20px",
                background: "var(--panel, #FFFCF7)",
                border: "1px solid var(--line, #E6E0D5)",
                borderRadius: "16px",
              }}
            >
              <span
                style={{
                  display: "block",
                  color: "var(--muted, #52645A)",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                Серія навчання
              </span>

              <strong
                style={{
                  fontSize: "25px",
                  color: "var(--ink, #253A33)",
                }}
              >
                {stats.streak
                  ? `${stats.streak} ${pluralDays(stats.streak)}`
                  : "0 днів"}
              </strong>
            </div>
          </div>

          {subjects.length === 0 ? (
            <p className="state">
              Предметів ще немає. Додай перший предмет,
              щоб почати відстежувати прогрес.
            </p>
          ) : (
            <ul
              className="sf-subject-cards"
              aria-label="Предмети й тижневі цілі"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "18px",
                padding: 0,
                margin: "0 0 30px",
              }}
            >
              {subjects.map((subject, index) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  done={stats.perSubject[subject.id] || 0}
                  busy={busy}
                  color={COLORS[index % COLORS.length]}
                  onAddMinutes={addMinutes}
                  onRemove={remove}
                />
              ))}
            </ul>
          )}

          {actionError && (
            <p className="error" role="alert">
              {actionError}
            </p>
          )}

          <div
            style={{
              padding: "24px",
              background: "var(--panel, #FFFCF7)",
              border: "1px solid var(--line, #E6E0D5)",
              borderRadius: "18px",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                color: "var(--ink, #253A33)",
              }}
            >
              + Новий предмет
            </h3>

            <AddSubjectForm
              onAdd={addSubject}
              busy={busy}
            />
          </div>
        </>
      )}
    </section>
  );
}
