
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

const PRESETS = [15, 25, 45, 60];

function localToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function FocusTimer({ tracker }) {
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState("");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const endTimeRef = useRef(null);
  const remainingRef = useRef(remaining);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      const seconds = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000)
      );

      remainingRef.current = seconds;
      setRemaining(seconds);

      if (seconds === 0) {
        setRunning(false);
        endTimeRef.current = null;
      }
    }, 250);

    return () => clearInterval(interval);
  }, [running]);

  const totalSeconds = duration * 60;
  const progress =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, ((totalSeconds - remaining) / totalSeconds) * 100))
      : 0;

  const completed = remaining === 0;
  const started = remaining < totalSeconds;

  function chooseDuration(value) {
    if (running || saving) return;

    setDuration(value);
    setRemaining(value * 60);
    remainingRef.current = value * 60;
    endTimeRef.current = null;
    setError("");
    setSuccess("");
  }

  function applyCustomDuration() {
    const value = Number(customDuration);

    if (!Number.isInteger(value) || value < 1 || value > 480) {
      setError("Введіть тривалість від 1 до 480 хвилин.");
      return;
    }

    chooseDuration(value);
  }

  function startPause() {
    if (saving || completed) return;

    setError("");
    setSuccess("");

    if (running) {
      const seconds = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000)
      );

      remainingRef.current = seconds;
      setRemaining(seconds);
      setRunning(false);
      endTimeRef.current = null;
    } else {
      if (!subject) {
        setError("Спочатку оберіть предмет.");
        return;
      }

      endTimeRef.current = Date.now() + remainingRef.current * 1000;
      setRunning(true);
    }
  }

  function reset() {
    if (saving) return;

    setRunning(false);
    endTimeRef.current = null;
    remainingRef.current = totalSeconds;
    setRemaining(totalSeconds);
    setError("");
    setSuccess("");
  }

  async function saveSession() {
    if (!completed || saving || !subject) {
      setError("Завершіть таймер і виберіть предмет.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.addSession({
        subjectId: Number(subject),
        minutes: duration,
        note: note.trim() || "Фокус-сесія",
        studiedOn: localToday(),
      });

      if (tracker.reload) {
        await tracker.reload();
      }

      setSuccess("Сесію успішно збережено!");
      setNote("");
      setRemaining(totalSeconds);
      remainingRef.current = totalSeconds;
    } catch (err) {
      setError(err.message || "Не вдалося зберегти сесію.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sf-focus">
      <div className="sf-focus-heading">
        <h3>Час зосередитися</h3>
        <p>Один предмет. Одна мета. Повна концентрація.</p>
      </div>

      <div className="sf-focus-presets">
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            disabled={running || saving}
            className={duration === value ? "active" : ""}
            onClick={() => chooseDuration(value)}
          >
            {value} хв
          </button>
        ))}
      </div>

      <div className="sf-focus-custom">
        <label htmlFor="sf-focus-duration">
          Власна тривалість
        </label>

        <div>
          <input
            id="sf-focus-duration"
            type="number"
            min="1"
            max="480"
            step="1"
            placeholder="Хвилини"
            value={customDuration}
            disabled={running || saving}
            onChange={(event) =>
              setCustomDuration(event.target.value)
            }
          />

          <button
            type="button"
            disabled={running || saving}
            onClick={applyCustomDuration}
          >
            Застосувати
          </button>
        </div>
      </div>

      <div
        className="sf-focus-ring"
        style={{
          background: `conic-gradient(#68856E ${progress}%, #E2E9DF ${progress}%)`,
        }}
        role="progressbar"
        aria-label="Прогрес фокус-сесії"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div className="sf-focus-ring-inner">
          <span className="sf-focus-time">
            {formatTimer(remaining)}
          </span>

          <span className="sf-focus-caption">
            {completed
              ? "Сесію завершено"
              : running
              ? "Час працювати"
              : started
              ? "Пауза"
              : "Готова до фокусу"}
          </span>
        </div>
      </div>

      <div className="sf-focus-controls">
        <button
          type="button"
          className="sf-focus-primary"
          disabled={completed || saving}
          onClick={startPause}
        >
          {running
            ? "Пауза"
            : started
            ? "Продовжити"
            : "Почати фокус"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={reset}
        >
          Скинути
        </button>
      </div>

      <div className="sf-focus-details">
        <label>
          Навчальний предмет
          <select
            value={subject}
            disabled={running || saving}
            onChange={(event) =>
              setSubject(event.target.value)
            }
          >
            <option value="">Оберіть предмет</option>

            {tracker.subjects?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Нотатка про навчання
          <input
            type="text"
            placeholder="Що сьогодні вивчила?"
            value={note}
            disabled={saving}
            onChange={(event) =>
              setNote(event.target.value)
            }
          />
        </label>
      </div>

      {error && (
        <p className="sf-focus-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="sf-focus-success" role="status">
          {success}
        </p>
      )}

      <button
        type="button"
        className="sf-focus-save"
        disabled={!completed || saving}
        onClick={saveSession}
      >
        {saving
          ? "Збереження..."
          : "Зберегти завершену сесію"}
      </button>
    </div>
  );
}
