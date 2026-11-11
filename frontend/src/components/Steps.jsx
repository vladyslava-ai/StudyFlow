import { STEPS } from "../data/content.js";

export default function Steps() {
  return (
    <section className="wrap block" id="how" aria-labelledby="how-title">
      <div className="section-head">
        <h2 id="how-title">Як це працює</h2>
        <p>Від першого предмета до зрозумілого тижня потрібно чотири кроки.</p>
      </div>

      <ol className="plan">
        {STEPS.map((step) => (
          <li key={step.title}>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
