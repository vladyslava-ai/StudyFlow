import { FEATURES } from "../data/content.js";

export default function Features() {
  return (
    <section className="wrap block" id="features" aria-labelledby="features-title">
      <div className="section-head">
        <h2 id="features-title">Що вміє трекер</h2>
        <p>Чотири речі, які потрібні, щоб навчання не губилося серед інших справ.</p>
      </div>

      <dl className="features">
        {FEATURES.map((feature) => (
          <div key={feature.title}>
            <dt>{feature.title}</dt>
            <dd>{feature.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
