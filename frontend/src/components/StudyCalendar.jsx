
import { useMemo, useState } from "react";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const PRIORITIES = {
  high: { label: "Високий", color: "#B86B64" },
  medium: { label: "Середній", color: "#C5A15E" },
  low: { label: "Низький", color: "#72977C" },
};

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthDays(month) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const first = new Date(year, monthIndex, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, monthIndex + 1, 0).getDate();

  return [
    ...Array(offset).fill(null),
    ...Array.from(
      { length: days },
      (_, index) => new Date(year, monthIndex, index + 1)
    ),
  ];
}

export default function StudyCalendar({
  tasks = [],
  calendar = [],
}) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selected, setSelected] = useState(() => dateKey(new Date()));

  const today = dateKey(new Date());

  const days = useMemo(() => getMonthDays(month), [month]);

  const activityByDate = useMemo(
    () =>
      new Map(
        calendar.map((day) => [
          String(day.date).slice(0, 10),
          Number(day.minutes) || 0,
        ])
      ),
    [calendar]
  );

  const tasksByDate = useMemo(() => {
    const grouped = new Map();

    for (const task of tasks) {
      if (!task.due_date) continue;

      const key = String(task.due_date).slice(0, 10);

      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(task);
    }

    return grouped;
  }, [tasks]);

  const selectedTasks = tasksByDate.get(selected) || [];
  const selectedMinutes = activityByDate.get(selected) || 0;

  const monthLabel = month.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });

  function moveMonth(offset) {
    setMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + offset,
          1
        )
    );
  }

  function goToday() {
    const now = new Date();

    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(dateKey(now));
  }

  return (
    <div className="sf-study-calendar">
      <div className="sf-calendar-heading">
        <div>
          <h3>Навчальний календар</h3>
          <p>Усі дедлайни та навчальна активність в одному місці.</p>
        </div>

        <button type="button" onClick={goToday}>
          Сьогодні
        </button>
      </div>

      <div className="sf-calendar-toolbar">
        <button
          type="button"
          aria-label="Попередній місяць"
          onClick={() => moveMonth(-1)}
        >
          ‹
        </button>

        <h4>{monthLabel}</h4>

        <button
          type="button"
          aria-label="Наступний місяць"
          onClick={() => moveMonth(1)}
        >
          ›
        </button>
      </div>

      <div className="sf-calendar-grid">
        {WEEKDAYS.map((day) => (
          <div className="sf-calendar-weekday" key={day}>
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                className="sf-calendar-empty"
              />
            );
          }

          const key = dateKey(date);
          const dayTasks = tasksByDate.get(key) || [];
          const minutes = activityByDate.get(key) || 0;

          return (
            <button
              type="button"
              key={key}
              className={[
                "sf-calendar-day",
                key === today ? "is-today" : "",
                key === selected ? "is-selected" : "",
              ].join(" ")}
              onClick={() => setSelected(key)}
              aria-pressed={key === selected}
              aria-label={`${key}, ${dayTasks.length} завдань, ${minutes} хв навчання`}
            >
              <span className="sf-calendar-number">
                {date.getDate()}
              </span>

              <div className="sf-calendar-dots">
                {dayTasks.slice(0, 3).map((task) => (
                  <span
                    key={task.id}
                    className="sf-calendar-dot"
                    style={{
                      background:
                        PRIORITIES[task.priority]?.color || "#72977C",
                      opacity: task.status === "done" ? 0.4 : 1,
                    }}
                  />
                ))}
              </div>

              {minutes > 0 && (
                <span className="sf-calendar-minutes">
                  {minutes} хв
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sf-calendar-legend">
        <span><i style={{ background: "#72977C" }} /> Низький</span>
        <span><i style={{ background: "#C5A15E" }} /> Середній</span>
        <span><i style={{ background: "#B86B64" }} /> Високий</span>
      </div>

      <section className="sf-calendar-details">
        <h4>
          {new Date(`${selected}T12:00:00`).toLocaleDateString(
            "uk-UA",
            { day: "numeric", month: "long", year: "numeric" }
          )}
        </h4>

        <p className="sf-calendar-study">
          Навчальна активність: <strong>{selectedMinutes} хв</strong>
        </p>

        {selectedTasks.length ? (
          <div className="sf-calendar-task-list">
            {selectedTasks.map((task) => (
              <div className="sf-calendar-task" key={task.id}>
                <span
                  className="sf-calendar-task-marker"
                  style={{
                    background:
                      PRIORITIES[task.priority]?.color || "#72977C",
                  }}
                />

                <div>
                  <strong>{task.title}</strong>
                  <small>
                    {PRIORITIES[task.priority]?.label || "Середній"}
                    {" пріоритет · "}
                    {task.status === "done"
                      ? "Виконано"
                      : task.status === "progress"
                      ? "У процесі"
                      : "Заплановано"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="sf-calendar-no-tasks">
            На цю дату завдань немає.
          </p>
        )}
      </section>

      <section className="sf-calendar-activity">
        <h4>Активність за останні 90 днів</h4>

        <div className="extra-calendar">
          {calendar.map((day) => (
            <span
              key={day.date}
              title={`${day.date}: ${day.minutes} хв`}
              className={
                "extra-day " +
                (day.minutes >= 120
                  ? "d3"
                  : day.minutes >= 60
                  ? "d2"
                  : day.minutes > 0
                  ? "d1"
                  : "")
              }
            />
          ))}
        </div>

        <p>
          Активних днів:{" "}
          {calendar.filter((day) => day.minutes > 0).length}
          {" із "}
          {calendar.length}
        </p>
      </section>
    </div>
  );
}
