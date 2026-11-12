
import { useMemo } from "react";

const COLORS = [
  "#76977C",
  "#B5A1C7",
  "#D3AA76",
  "#91AFC4",
  "#C58F94",
  "#A5B58B",
];

const WEEKDAYS = [
  "Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"
];

function formatTime(minutes) {
  const value = Number(minutes) || 0;
  const hours = Math.floor(value / 60);
  const rest = value % 60;

  if (!hours) return `${rest} хв`;
  return rest ? `${hours} год ${rest} хв` : `${hours} год`;
}

function dateLabel(value) {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return WEEKDAYS[date.getDay()];
}

function StatCard({ icon, value, label, detail }) {
  return (
    <div className="sf-analytics-stat">
      <span className="sf-analytics-stat-icon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export default function AnalyticsDashboard({
  tracker,
  tasks = [],
}) {
  const stats = tracker?.stats || {};
  const subjects = stats.per_subject || [];
  const days = stats.per_day || [];

  const totalMinutes = Number(stats.total_minutes) || 0;
  const streak = Number(stats.streak_days) || 0;

  const completedTasks = tasks.filter(
    (task) => task.status === "done"
  ).length;

  const activeTasks = tasks.filter(
    (task) => task.status !== "done"
  ).length;

  const totalGoal = subjects.reduce(
    (sum, item) => sum + (Number(item.goal_minutes) || 0),
    0
  );

  const goalProgress = totalGoal
    ? Math.min(100, Math.round((totalMinutes / totalGoal) * 100))
    : 0;

  const chartDays = useMemo(() => {
    return days.map((day) => ({
      ...day,
      minutes: Number(day.minutes) || 0,
      label: dateLabel(day.date),
    }));
  }, [days]);

  const maxMinutes = Math.max(
    60,
    ...chartDays.map((day) => day.minutes)
  );

  const bestDay = chartDays.reduce(
    (best, day) =>
      !best || day.minutes > best.minutes ? day : best,
    null
  );

  return (
    <div className="sf-analytics">
      <header className="sf-analytics-heading">
        <div>
          <span className="sf-analytics-eyebrow">
            STUDYFLOW / INSIGHTS
          </span>
          <h2>Твій навчальний прогрес</h2>
          <p>
            Статистика за останні 7 днів.
            Кожна хвилина наближає тебе до мети.
          </p>
        </div>
      </header>

      <div className="sf-analytics-stats">
        <StatCard
          icon="◷"
          value={formatTime(totalMinutes)}
          label="Час навчання"
          detail="За останні 7 днів"
        />

        <StatCard
          icon="✦"
          value={`${streak} дн.`}
          label="Серія навчання"
          detail="Днів поспіль"
        />

        <StatCard
          icon="✓"
          value={completedTasks}
          label="Виконані завдання"
          detail={`${activeTasks} ще активні`}
        />

        <StatCard
          icon="◎"
          value={`${goalProgress}%`}
          label="Виконання цілей"
          detail="Загальний тижневий прогрес"
        />
      </div>

      <div className="sf-analytics-sections">
        <section className="sf-analytics-card">
          <div className="sf-analytics-card-heading">
            <div>
              <h3>Навчальна активність</h3>
              <p>Час навчання за днями</p>
            </div>
            <span className="sf-analytics-tag">7 днів</span>
          </div>

          <div className="sf-analytics-chart">
            {chartDays.map((day) => {
              const height =
                maxMinutes > 0
                  ? (day.minutes / maxMinutes) * 100
                  : 0;

              return (
                <div
                  className="sf-analytics-chart-column"
                  key={day.date}
                >
                  <span className="sf-analytics-chart-value">
                    {day.minutes > 0 ? `${day.minutes} хв` : "0"}
                  </span>

                  <div className="sf-analytics-chart-track">
                    <div
                      className="sf-analytics-chart-bar"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${day.minutes} хв`}
                    />
                  </div>

                  <span className="sf-analytics-chart-day">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          {!chartDays.length && (
            <p className="sf-analytics-empty">
              Дані про активність поки відсутні.
            </p>
          )}

          <div className="sf-analytics-chart-footer">
            <span>Загалом: {formatTime(totalMinutes)}</span>
            <span>
              Найактивніший день:{" "}
              {bestDay?.minutes > 0
                ? `${bestDay.label} (${bestDay.minutes} хв)`
                : "—"}
            </span>
          </div>
        </section>

        <section className="sf-analytics-card">
          <div className="sf-analytics-card-heading">
            <div>
              <h3>Тижневі цілі</h3>
              <p>Твій загальний прогрес</p>
            </div>
          </div>

          <div className="sf-analytics-goal-circle">
            <div>
              <strong>{goalProgress}%</strong>
              <span>виконано</span>
            </div>
            <svg viewBox="0 0 180 180" aria-hidden="true">
              <circle
                cx="90"
                cy="90"
                r="74"
                fill="none"
                stroke="#E5EAE1"
                strokeWidth="12"
              />
              <circle
                cx="90"
                cy="90"
                r="74"
                fill="none"
                stroke="#72977C"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${goalProgress * 4.65} 465`}
                transform="rotate(-90 90 90)"
              />
            </svg>
          </div>

          <div className="sf-analytics-goal-summary">
            <strong>{formatTime(totalMinutes)}</strong>
            <span>із {formatTime(totalGoal)} запланованих</span>
          </div>
        </section>
      </div>

      <section className="sf-analytics-card">
        <div className="sf-analytics-card-heading">
          <div>
            <h3>Прогрес за предметами</h3>
            <p>Результати за поточний тиждень</p>
          </div>
        </div>

        {subjects.length ? (
          <div className="sf-analytics-subjects">
            {subjects.map((item, index) => {
              const goal = Number(item.goal_minutes) || 0;
              const minutes = Number(item.minutes) || 0;

              const percent = goal
                ? Math.min(100, Math.round((minutes / goal) * 100))
                : 0;

              return (
                <div
                  className="sf-analytics-subject"
                  key={item.subject_id}
                >
                  <div className="sf-analytics-subject-header">
                    <div>
                      <span
                        className="sf-analytics-subject-dot"
                        style={{
                          background: COLORS[index % COLORS.length],
                        }}
                      />
                      <strong>{item.name}</strong>
                    </div>

                    <span>{percent}%</span>
                  </div>

                  <div className="sf-analytics-subject-track">
                    <div
                      style={{
                        width: `${percent}%`,
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>

                  <small>
                    {formatTime(minutes)} із {formatTime(goal)}
                  </small>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="sf-analytics-empty">
            Додай предмет, щоб побачити його прогрес.
          </p>
        )}
      </section>

      <div className="sf-analytics-footer">
        <span>✳</span>
        <p>
          Маленькі кроки щодня створюють великі результати.
        </p>
      </div>
    </div>
  );
}
