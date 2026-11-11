import { useState } from "react";

const LINKS = [
  ["#tracker", "Трекер"],
  ["#journal", "Журнал"],
  ["#week", "Тиждень"],
  ["#insights", "Підсумок"],
];

const SERVER_LABEL = {
  loading: "Підключення до сервера",
  ready: "Сервер працює",
  error: "Сервер недоступний",
};

export default function Header({ status }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* сховище недоступне */
    }
  }

  return (
    <header className="top">
      <div className="wrap top-row">
        <a className="brand" href="#top">Трекер навчання</a>
        <nav aria-label="Розділи сторінки">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
          <a href="/docs" target="_blank" rel="noreferrer">API</a>
        </nav>
        <span className={`server ${status}`} role="status">
          <i aria-hidden="true" />
          <span>{SERVER_LABEL[status]}</span>
        </span>
        <button className="theme" type="button" onClick={toggleTheme} aria-label="Перемкнути світлу й темну тему">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
