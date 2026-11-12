
import { useMemo } from "react";

function localDate(value) {
  return new Date(`${String(value).slice(0, 10)}T12:00:00`);
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  return localDate(value).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
  });
}

function RecommendationCard({
  icon,
  category,
  title,
  description,
  children,
}) {
  return (
    <article className="sf-smart-card">
      <div className="sf-smart-card-top">
        <span className="sf-smart-icon">{icon}</span>
        <span className="sf-smart-category">{category}</span>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </article>
  );
}

export default function SmartRecommendations({
  tracker,
  tasks = [],
}) {
  const stats = tracker?.stats || {};
  const subjects = stats.per_subject || [];
  const streak = Number(stats.streak_days) || 0;

  const today = todayKey();

  const priorities = useMemo(() => {
    return subjects
      .map((subject) => {
        const goal = Number(subject.goal_minutes) || 0;
        const minutes = Number(subject.minutes) || 0;

        return {
          ...subject,
          remaining: Math.max(0, goal - minutes),
          progress: goal > 0 ? minutes / goal : 1,
        };
      })
      .filter((subject) => subject.remaining > 0)
      .sort((a, b) => a.progress - b.progress);
  }, [subjects]);

  const deadlines = useMemo(() => {
    return tasks
      .filter(
        (task) =>
          task.status !== "done" && task.due_date
      )
      .sort((a, b) =>
        String(a.due_date).localeCompare(String(b.due_date))
      )
      .slice(0, 4);
  }, [tasks]);

  const plan = useMemo(() => {
    const dailyBudget = 90;
    let available = dailyBudget;

    return priorities.slice(0, 3).map((subject, index) => {
      const slotsLeft = Math.min(3, priorities.length) - index;

      const minutes = Math.min(
        subject.remaining,
        Math.max(1, Math.floor(available / slotsLeft))
      );

      available -= minutes;

      return {
        ...subject,
        recommendedMinutes: minutes,
      };
    });
  }, [priorities]);

  const completedTasks = tasks.filter(
    (task) => task.status === "done"
  ).length;

  const activeTasks = tasks.filter(
    (task) => task.status !== "done"
  ).length;

  return (
    <div className="sf-smart">
      <header className="sf-smart-heading">
        <span className="sf-smart-eyebrow">
          STUDYFLOW / SMART INSIGHTS
        </span>

        <h2>Твій персональний навчальний план</h2>

        <p>
          Рекомендації на основі твого прогресу,
          активності та найближчих дедлайнів.
        </p>
      </header>

      <div className="sf-smart-summary">
        <div>
          <strong>{priorities.length}</strong>
          <span>предметів потребують уваги</span>
        </div>

        <div>
          <strong>{activeTasks}</strong>
          <span>активних завдань</span>
        </div>

        <div>
          <strong>{streak}</strong>
          <span>днів навчальної серії</span>
        </div>
      </div>

      <div className="sf-smart-grid">
        <RecommendationCard
          icon="◎"
          category="ПРІОРИТЕТ"
          title="На чому зосередитися"
          description="Предмети з найменшим відсотком виконання тижневої цілі."
        >
          {priorities.length ? (
            <div className="sf-smart-priorities">
              {priorities.slice(0, 3).map((subject) => (
                <div key={subject.subject_id}>
                  <div className="sf-smart-priority-row">
                    <strong>{subject.name}</strong>
                    <span>
                      {Math.round(subject.progress * 100)}%
                    </span>
                  </div>

                  <div className="sf-smart-progress">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          subject.progress * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <small>
                    Залишилося {subject.remaining} хв
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="sf-smart-positive">
              Усі наявні тижневі цілі виконані
              або ще не встановлені.
            </p>
          )}
        </RecommendationCard>

        <RecommendationCard
          icon="▣"
          category="ДЕДЛАЙНИ"
          title="Що потрібно завершити"
          description="Найближчі невиконані завдання."
        >
          {deadlines.length ? (
            <div className="sf-smart-deadlines">
              {deadlines.map((task) => {
                const date = String(task.due_date).slice(0, 10);
                const overdue = date < today;

                return (
                  <div key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <small>
                        {formatDate(task.due_date)}
                      </small>
                    </div>

                    <span
                      className={
                        overdue
                          ? "sf-smart-overdue"
                          : "sf-smart-upcoming"
                      }
                    >
                      {overdue
                        ? "Прострочено"
                        : date === today
                        ? "Сьогодні"
                        : "Заплановано"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="sf-smart-positive">
              Немає невиконаних завдань із дедлайнами.
            </p>
          )}
        </RecommendationCard>

        <RecommendationCard
          icon="◷"
          category="ПЛАН НА СЬОГОДНІ"
          title="Рекомендовані фокус-сесії"
          description="Орієнтовний план до 90 хвилин для предметів, що відстають."
        >
          {plan.length ? (
            <div className="sf-smart-plan">
              {plan.map((subject, index) => (
                <div key={subject.subject_id}>
                  <span>{index + 1}</span>

                  <div>
                    <strong>{subject.name}</strong>
                    <small>
                      Фокус-сесія · {subject.recommendedMinutes} хв
                    </small>
                  </div>
                </div>
              ))}

              <a href="#/timer" className="sf-smart-link">
                Почати навчання →
              </a>
            </div>
          ) : (
            <p className="sf-smart-positive">
              Додай предмети з тижневими цілями,
              щоб сформувати план.
            </p>
          )}
        </RecommendationCard>

        <RecommendationCard
          icon="✦"
          category="МОТИВАЦІЯ"
          title="Твій навчальний ритм"
          description="Невелика порада на основі поточної активності."
        >
          <div className="sf-smart-motivation">
            <p>
              {streak >= 7
                ? "Чудова стабільність! Ти навчаєшся вже щонайменше 7 днів поспіль."
                : streak >= 3
                ? "Ти формуєш регулярну звичку. Продовжуй у комфортному темпі."
                : "Спробуй приділяти навчанню хоча б 15 хвилин щодня."}
            </p>

            <div className="sf-smart-motivation-stats">
              <span>
                Виконано завдань: <b>{completedTasks}</b>
              </span>
              <span>
                Активних завдань: <b>{activeTasks}</b>
              </span>
            </div>
          </div>
        </RecommendationCard>
      </div>

      <footer className="sf-smart-footer">
        ✳ Рекомендації формуються автоматично
        на основі збережених даних StudyFlow.
      </footer>
    </div>
  );
}
