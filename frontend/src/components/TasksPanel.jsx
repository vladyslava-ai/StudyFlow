
import { useMemo, useState } from "react";

const PRIORITIES = {
  low: {
    label: "Низький",
    color: "#527D60",
    background: "#E6F0E5",
  },
  medium: {
    label: "Середній",
    color: "#96722E",
    background: "#F8EED4",
  },
  high: {
    label: "Високий",
    color: "#A5524D",
    background: "#F7E3DF",
  },
};

const STATUSES = {
  planned: "Заплановано",
  progress: "У процесі",
  done: "Виконано",
};

function formatDate(value) {
  if (!value) return "Без дедлайну";

  const date = String(value).slice(0, 10);
  const parts = date.split("-");

  if (parts.length !== 3) return value;

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function TaskTable({ tasks, busy, onStatus, onDelete }) {
  if (!tasks.length) {
    return (
      <p className="sf-tasks-empty">
        Тут поки немає завдань.
      </p>
    );
  }

  return (
    <div className="sf-tasks-scroll">
      <table className="sf-tasks-table">
        <thead>
          <tr>
            <th>Завдання</th>
            <th>Пріоритет</th>
            <th>Дедлайн</th>
            <th>Статус</th>
            <th aria-label="Дії"></th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => {
            const priority =
              PRIORITIES[task.priority] || PRIORITIES.medium;

            return (
              <tr key={task.id}>
                <td className="sf-task-title">
                  {task.title}
                </td>

                <td>
                  <span
                    className="sf-priority"
                    style={{
                      color: priority.color,
                      background: priority.background,
                    }}
                  >
                    <span className="sf-priority-dot" />
                    {priority.label}
                  </span>
                </td>

                <td className="sf-task-date">
                  {formatDate(task.due_date)}
                </td>

                <td>
                  <select
                    aria-label={`Статус: ${task.title}`}
                    value={task.status}
                    disabled={busy}
                    onChange={(event) =>
                      onStatus(task.id, event.target.value)
                    }
                  >
                    {Object.entries(STATUSES).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </td>

                <td>
                  <button
                    type="button"
                    className="sf-task-delete"
                    disabled={busy}
                    aria-label={`Видалити ${task.title}`}
                    onClick={() => onDelete(task)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TasksPanel({
  tasks = [],
  busy = false,
  onAdd,
  onStatus,
  onDelete,
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const active = useMemo(
    () => tasks.filter((task) => task.status !== "done"),
    [tasks]
  );

  const completed = useMemo(
    () => tasks.filter((task) => task.status === "done"),
    [tasks]
  );

  async function submit(event) {
    event.preventDefault();

    if (!title.trim() || busy) return;

    const success = await onAdd({
      title: title.trim(),
      priority,
      due_date: due || null,
    });

    if (success) {
      setTitle("");
      setPriority("medium");
      setDue("");
    }
  }

  function deleteTask(task) {
    if (
      window.confirm(
        `Видалити завдання «${task.title}» назавжди?`
      )
    ) {
      onDelete(task.id);
    }
  }

  return (
    <div className="sf-tasks">
      <div className="sf-tasks-heading">
        <div>
          <h3>Мої завдання</h3>
          <p>Плануй справи та відстежуй виконання.</p>
        </div>
      </div>

      <div className="sf-tasks-stats">
        <div>
          <strong>{active.length}</strong>
          <span>Активних</span>
        </div>

        <div>
          <strong>
            {active.filter(
              (task) => task.status === "progress"
            ).length}
          </strong>
          <span>У процесі</span>
        </div>

        <div>
          <strong>{completed.length}</strong>
          <span>Виконано</span>
        </div>
      </div>

      <form className="sf-tasks-form" onSubmit={submit}>
        <label>
          Назва завдання
          <input
            type="text"
            required
            maxLength={160}
            placeholder="Наприклад, завершити проєкт"
            value={title}
            disabled={busy}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label>
          Пріоритет
          <select
            value={priority}
            disabled={busy}
            onChange={(event) =>
              setPriority(event.target.value)
            }
          >
            <option value="low">Низький</option>
            <option value="medium">Середній</option>
            <option value="high">Високий</option>
          </select>
        </label>

        <label>
          Дедлайн
          <input
            type="date"
            value={due}
            disabled={busy}
            onChange={(event) => setDue(event.target.value)}
          />
        </label>

        <button type="submit" disabled={busy}>
          + Додати
        </button>
      </form>

      <div className="sf-tasks-section">
        <h4>Активні завдання</h4>

        <TaskTable
          tasks={active}
          busy={busy}
          onStatus={onStatus}
          onDelete={deleteTask}
        />
      </div>

      <div className="sf-tasks-history">
        <button
          type="button"
          className="sf-history-toggle"
          aria-expanded={showHistory}
          onClick={() => setShowHistory((value) => !value)}
        >
          <span>
            Історія виконаних ({completed.length})
          </span>

          <span>{showHistory ? "−" : "+"}</span>
        </button>

        {showHistory && (
          <TaskTable
            tasks={completed}
            busy={busy}
            onStatus={onStatus}
            onDelete={deleteTask}
          />
        )}
      </div>
    </div>
  );
}
