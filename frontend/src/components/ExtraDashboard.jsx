import SmartRecommendations from "./SmartRecommendations.jsx";
import AnalyticsDashboard from "./AnalyticsDashboard.jsx";
import FocusTimer from "./FocusTimer.jsx";
import StudyCalendar from "./StudyCalendar.jsx";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import TasksPanel from "./TasksPanel.jsx";

function today() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Panel({ title, children }) {
  return (
    <section className="extra-panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default function ExtraDashboard({
  tracker,
  activePanel = "analytics",
}) {
  const [tasks, setTasks] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [error, setError] = useState("");
  const [tasksBusy, setTasksBusy] = useState(false);

  const [mode, setMode] = useState("focus");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [savingTimer, setSavingTimer] = useState(false);

  async function refresh() {
    const [taskData, calendarData] = await Promise.all([
      api.tasks(),
      api.calendar(),
    ]);

    setTasks(taskData);
    setCalendar(calendarData);
  }

  useEffect(() => {
    let active = true;

    Promise.all([api.tasks(), api.calendar()])
      .then(([taskData, calendarData]) => {
        if (!active) return;

        setTasks(taskData);
        setCalendar(calendarData);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  const week = tracker.stats;
  const bySubject = week?.per_subject || [];

  const completedTasks = tasks.filter(
    (task) => task.status === "done"
  ).length;

  const activeTasks = tasks.filter(
    (task) => task.status !== "done"
  ).length;

  const recommendations = useMemo(() => {
    if (!bySubject.length) {
      return [
        "Додайте предмет і першу навчальну сесію, щоб отримати персональні поради.",
      ];
    }

    const behind = bySubject
      .filter(
        (item) =>
          item.goal_minutes > 0 &&
          item.minutes < item.goal_minutes
      )
      .sort(
        (a, b) =>
          a.minutes / a.goal_minutes -
          b.minutes / b.goal_minutes
      );

    return [
      behind.length
        ? `Найбільше уваги потребує «${behind[0].name}»: ${behind[0].minutes} із ${behind[0].goal_minutes} хв за тиждень.`
        : "Усі тижневі цілі виконані. Час запланувати нові!",

      week?.streak_days > 1
        ? `Серія навчання: ${week.streak_days} днів поспіль.`
        : "Для серії навчання спробуйте займатися щодня хоча б 10 хвилин.",
    ];
  }, [week]);

  async function performTaskAction(action) {
    if (tasksBusy) return false;

    setTasksBusy(true);
    setError("");

    try {
      await action();
      await refresh();
      return true;
    } catch (err) {
      setError(err.message || "Не вдалося виконати дію.");
      return false;
    } finally {
      setTasksBusy(false);
    }
  }

  async function addTask(data) {
    return performTaskAction(() => api.addTask(data));
  }

  async function updateTaskStatus(id, status) {
    return performTaskAction(() =>
      api.patchTask(id, { status })
    );
  }

  async function deleteTask(id) {
    return performTaskAction(() => api.deleteTask(id));
  }

  const minutes = mode === "focus" ? 25 : 5;

  function changeMode(nextMode) {
    setRunning(false);
    setMode(nextMode);
    setRemaining(nextMode === "focus" ? 25 * 60 : 5 * 60);
  }

  function resetTimer() {
    setRunning(false);
    setRemaining(minutes * 60);
  }

  async function saveTimer() {
    if (savingTimer) return;

    if (!subject) {
      setError("Виберіть предмет для збереження сесії.");
      return;
    }

    if (mode !== "focus" || remaining !== 0) {
      setError(
        "Спочатку завершіть фокус-сесію."
      );
      return;
    }

    setSavingTimer(true);
    setError("");

    try {
      await api.addSession({
        subjectId: Number(subject),
        minutes,
        note: note.trim() || "Pomodoro",
        studiedOn: today(),
      });

      if (tracker.reload) {
        await tracker.reload();
      }

      setNote("");
      resetTimer();
    } catch (err) {
      setError(
        err.message || "Не вдалося зберегти сесію."
      );
    } finally {
      setSavingTimer(false);
    }
  }

  return (
    <section
      id="productivity"
      className="wrap extras"
    >
      {error && (
        <p
          className="extra-error"
          role="alert"
        >
          {error}

          <button
            type="button"
            aria-label="Закрити повідомлення"
            onClick={() => setError("")}
          >
            ×
          </button>
        </p>
      )}

      <div
        className={`extra-grid extra-only-${activePanel}`}
      >
        {/* АНАЛІТИКА */}
        <Panel title="Аналітика">
          <AnalyticsDashboard
           tracker={tracker}
           tasks={tasks}
         />
        </Panel>

        {/* ФОКУС-ТАЙМЕР */}
        <Panel title="Focus Timer">
          <FocusTimer tracker={tracker} />
        </Panel>

        {/* ЗАВДАННЯ */}
        <Panel title="Завдання та дедлайни">
          <TasksPanel
            tasks={tasks}
            busy={tasksBusy}
            onAdd={addTask}
            onStatus={updateTaskStatus}
            onDelete={deleteTask}
          />
        </Panel>

        {/* КАЛЕНДАР */}
        <Panel title="Календар">
          <StudyCalendar
            tasks={tasks}
            calendar={calendar}
          />
        </Panel>

        {/* РЕКОМЕНДАЦІЇ */}
        <Panel title="Рекомендації">
          <SmartRecommendations
            tracker={tracker}
            tasks={tasks}
         />
       </Panel>

        {/* ПРОФІЛЬ */}
        <Panel title="Профіль">
          Налаштування профілю доступні
          у розділі «Профіль».
        </Panel>
      </div>
    </section>
  );
}
