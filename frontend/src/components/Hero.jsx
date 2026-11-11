import Tracker from "./Tracker.jsx";

export default function Hero({ tracker, stats }) {
  return (
    <section className="wrap hero" aria-labelledby="hero-title">
      <div>
        <h1 id="hero-title">Скільки ви насправді вчитесь?</h1>
        <p className="lead">
          Трекер навчання записує, скільки часу ви витрачаєте на кожен предмет, і показує останні
          сім днів одним поглядом. Поставте тижневу ціль, додавайте сесії одним натисканням і бачте,
          де відстаєте.
        </p>
        <div className="actions">
          <a className="btn" href="#/subjects">Відкрити трекер</a>
          <a className="btn ghost" href="#/journal">Додати сесію</a>
        </div>
      </div>
      <Tracker tracker={tracker} stats={stats} />
    </section>
  );
}
