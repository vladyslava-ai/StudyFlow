import { dateLabel, formatTime } from "../lib/time.js";

// Зі статистики тижня складає прості висновки: що відбувалося й де відстаємо
function buildInsights(stats) {
  const active = stats.per_subject.filter((s) => s.minutes > 0);
  if (stats.total_minutes === 0 || active.length === 0) return [];

  const items = [];

  const bestDay = stats.per_day.reduce((best, day) => (day.minutes > best.minutes ? day : best));
  items.push({
    title: "Найпродуктивніший день",
    text: `${dateLabel(bestDay.date)}: ${formatTime(bestDay.minutes)}.`,
  });

  const top = active.reduce((best, s) => (s.minutes > best.minutes ? s : best));
  const share = Math.round((top.minutes / stats.total_minutes) * 100);
  items.push({
    title: "Найбільше часу",
    text: `${top.name}: ${formatTime(top.minutes)}, це ${share}% тижня.`,
  });

  const behind = stats.per_subject
    .filter((s) => !s.goal_reached)
    .reduce((worst, s) => (!worst || s.goal_minutes - s.minutes > worst.goal_minutes - worst.minutes ? s : worst), null);
  items.push(
    behind
      ? {
          title: "Найбільше відстає",
          text: `${behind.name}: до цілі ще ${formatTime(behind.goal_minutes - behind.minutes)}.`,
        }
      : { title: "Найбільше відстає", text: "Нічого, усі цілі тижня виконано." }
  );

  const reached = stats.per_subject.filter((s) => s.goal_reached).length;
  items.push({
    title: "Цілі тижня",
    text: `Виконано ${reached} з ${stats.per_subject.length}.`,
  });

  const average = Math.round(stats.total_minutes / stats.per_day.length);
  items.push({
    title: "У середньому",
    text: `${formatTime(average)} на день.`,
  });

  return items;
}

export default function Insights({ stats }) {
  const items = stats ? buildInsights(stats) : [];

  return (
    <section className="wrap block" id="insights" aria-labelledby="insights-title">
      <div className="section-head">
        <h2 id="insights-title">Підсумок тижня</h2>
        <p>Висновки сервер рахує зі збережених сесій за останні сім днів і оновлює після кожного запису.</p>
      </div>

      {items.length === 0 ? (
        <p className="state">За останні 7 днів занять ще не було. Додайте першу сесію, і тут з'являться висновки.</p>
      ) : (
        <dl className="insights">
          {items.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
