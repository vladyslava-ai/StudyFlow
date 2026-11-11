import { useState } from "react";

export default function AddSubjectForm({ onAdd, busy }) {
  const [name, setName] = useState("");
  const [hours, setHours] = useState("4");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();
    const goalHours = Number(hours);

    if (!cleanName) return setError("Введіть назву предмета.");
    if (cleanName.length > 60) return setError("Назва має бути не довшою за 60 символів.");
    if (!(goalHours >= 0.5 && goalHours <= 40)) return setError("Ціль має бути від 0,5 до 40 годин на тиждень.");

    setError("");
    const ok = await onAdd({ name: cleanName, goalMinutes: Math.round(goalHours * 60) });
    if (ok) {
      setName("");
      setHours("4");
    }
  }

  return (
    <form className="form inline" onSubmit={handleSubmit} noValidate>
      <div className="field grow">
        <label htmlFor="subject-name">Новий предмет</label>
        <input
          id="subject-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Наприклад, Tableau"
          maxLength={60}
          autoComplete="off"
        />
      </div>
      <div className="field narrow">
        <label htmlFor="subject-goal">Ціль, год на тиждень</label>
        <input
          id="subject-goal"
          type="number"
          inputMode="decimal"
          min="0.5"
          max="40"
          step="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
      </div>
      <button className="btn" type="submit" disabled={busy}>Додати предмет</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
