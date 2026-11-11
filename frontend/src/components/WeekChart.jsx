import { DAYS, weekdayLabel } from "../lib/time.js";

export default function WeekChart({ perDay }) {
  const scale = Math.max(180, ...perDay);
  // Зліва найстарший день, справа сьогодні
  const columns = Array.from({ length: DAYS }, (_, position) => {
    const ago = DAYS - 1 - position;
    return { ago, minutes: perDay[ago], label: weekdayLabel(ago) };
  });

  return (
    <section className="wrap block" id="week" aria-labelledby="week-title">
      <div className="section-head">
        <h2 id="week-title">Тиждень за днями</h2>
        <p>Висота стовпчика показує, скільки хвилин ви вчилися цього дня, число над ним теж у хвилинах. Сьогоднішній день виділено.</p>
      </div>

      <div className="chart-panel">
        <ol className="week" aria-label="Хвилини навчання за останні 7 днів">
          {columns.map((column) => (
            <li key={column.ago} className={column.ago === 0 ? "today" : undefined}>
              <span className="val">{column.minutes}</span>
              <span className="bar">
                <i style={{ height: `${(column.minutes / scale) * 100}%` }} />
              </span>
              <span className="day">{column.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
