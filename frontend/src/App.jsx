import { useEffect, useMemo, useState } from 'react';
import { useTracker } from './hooks/useTracker.js';
import { api } from './lib/api.js';

import AuthGate from './components/AuthGate.jsx';
import Account from './components/Account.jsx';
import Tracker from './components/Tracker.jsx';
import Journal from './components/Journal.jsx';
import ExtraDashboard from './components/ExtraDashboard.jsx';

const pages = [
  ['overview', 'Головна', '⌂'],
  ['subjects', 'Предмети', '▤'],
  ['journal', 'Журнал', '▦'],
  ['tasks', 'Завдання', '☑'],
  ['calendar', 'Календар', '▣'],
  ['timer', 'Фокус-таймер', '◷'],
  ['analytics', 'Аналітика', '▥'],
  ['tips', 'Рекомендації', '✧'],
  ['account', 'Профіль', '◉'],
];

const current = () => {
  const page = location.hash.replace(/^#\/?/, '');
  return pages.some(([id]) => id === page) ? page : 'overview';
};

const getInitialTheme = () => {
  const saved = localStorage.getItem('studyflow-theme');
  return saved === 'dark' ? 'dark' : 'light';
};

export default function App() {
  const [user, setUser] = useState(undefined);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('studyflow-theme', theme);
  }, [theme]);

  if (user === undefined) {
    return (
      <div className="sf-loading">
        ✳ StudyFlow
        <span>Завантаження...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthGate onLogin={setUser} />;
  }

  return (
    <Workspace
      user={user}
      setUser={setUser}
      theme={theme}
      setTheme={setTheme}
    />
  );
}

function Workspace({ user, setUser, theme, setTheme }) {
  const tracker = useTracker();

  const [page, setPage] = useState(current);
  const [menu, setMenu] = useState(false);

  const [goal, setGoal] = useState(() => {
    return Number(localStorage.getItem('studyflow-goal') || 600);
  });

  useEffect(() => {
    const update = () => {
      setPage(current());
      setMenu(false);
    };

    window.addEventListener('hashchange', update);

    return () => {
      window.removeEventListener('hashchange', update);
    };
  }, []);

  const stats = useMemo(() => {
    const data = tracker.stats;

    if (!data) {
      return {
        perSubject: {},
        perDay: Array(7).fill(0),
        total: 0,
        streak: 0,
      };
    }

    return {
      perSubject: Object.fromEntries(
        data.per_subject.map((item) => [
          item.subject_id,
          item.minutes,
        ])
      ),
      perDay: [...data.per_day]
        .reverse()
        .map((item) => item.minutes),
      total: data.total_minutes,
      streak: data.streak_days,
    };
  }, [tracker.stats]);

  const name = user.display_name || user.email.split('@')[0];

  const heading =
    pages.find(([id]) => id === page)?.[1] || 'Головна';

  const changeGoal = (event) => {
    const value = Number(event.target.value);
    setGoal(value);
    localStorage.setItem('studyflow-goal', String(value));
  };

  const exportStatistics = () => {
    const rows = [
      ['Дата', 'Хвилини'],
      ...(tracker.stats?.per_day || []).map((day) => [
        day.date,
        day.minutes,
      ]),
    ];

    const content =
      '\ufeff' + rows.map((row) => row.join(';')).join('\n');

    const blob = new Blob([content], {
      type: 'text/csv;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'studyflow-statistics.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <div className="app-shell sf-app">
      <a className="skip" href="#main">
        До вмісту
      </a>

      <aside className={`app-sidebar ${menu ? 'is-open' : ''}`}>
        <a href="#/overview" className="app-logo">
          <span className="app-logo-mark">✳</span>

          <span>
            StudyFlow
            <small>YOUR LEARNING SPACE</small>
          </span>
        </a>

        <div className="app-nav-caption">МІЙ ПРОСТІР</div>

        <nav className="app-nav">
          {pages.map(([id, label, icon]) => (
            <a
              href={`#/${id}`}
              key={id}
              className={page === id ? 'active' : ''}
            >
              <span className="app-nav-icon">{icon}</span>
              {label}
            </a>
          ))}
        </nav>

        <div className="sf-sidebar-foot">
          <div className="sf-sidebar-quote">
            «Прогрес — це маленькі кроки щодня.»
            <span>✦</span>
          </div>

          <button
            className="sf-theme"
            onClick={() =>
              setTheme((previous) =>
                previous === 'light' ? 'dark' : 'light'
              )
            }
          >
            {theme === 'light'
              ? '☾ Темна тема'
              : '☀ Світла тема'}
          </button>
        </div>
      </aside>

      {menu && (
        <button
          className="app-overlay"
          onClick={() => setMenu(false)}
          aria-label="Закрити меню"
        />
      )}

      <div className="app-content">
        <header className="app-topbar">
          <button
            className="app-menu-btn"
            onClick={() => setMenu(!menu)}
            aria-label="Відкрити меню"
          >
            ☰
          </button>

          <div className="sf-top-title">
            Робочий простір <span>/ {heading}</span>
          </div>

          <div className="sf-top-right">
            <span className="sf-top-date">
              {new Date().toLocaleDateString('uk-UA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>

            <a className="sf-user" href="#/account">
              <span className="sf-avatar">
                {user.avatar_data ? (
                  <img src={user.avatar_data} alt="Аватар" />
                ) : (
                  name[0].toUpperCase()
                )}
              </span>

              <strong>{name}</strong>
            </a>

            <button
              className="sf-logout"
              title="Вийти"
              onClick={logout}
            >
              ↪
            </button>
          </div>
        </header>

        <main className="app-main" id="main">
          {page === 'overview' ? (
            <>
              <div className="sf-welcome">
                <div>
                  <span className="sf-eyebrow">
                    ТВІЙ НАВЧАЛЬНИЙ ПРОСТІР ✳
                  </span>

                  <h1>
                    Привіт, {name}! <span>✦</span>
                  </h1>

                  <p>
                    Кожен крок наближає тебе до мети.
                    Продовжуй у своєму ритмі.
                  </p>
                </div>

                <a href="#/timer" className="sf-button">
                  Почати фокус →
                </a>
              </div>

              <div className="sf-overview">
                <section className="sf-goal">
                  <span className="sf-eyebrow">
                    НАВЧАЛЬНА ЦІЛЬ · ЦЬОГО ТИЖНЯ
                  </span>

                  <div className="sf-goal-row">
                    <div>
                      <strong>
                        {Math.floor(stats.total / 60)} год{' '}
                        {stats.total % 60} хв
                      </strong>

                      <p>
                        із {Math.floor(goal / 60)} год
                        запланованого навчання
                      </p>
                    </div>

                    <div className="sf-goal-percent">
                      {Math.min(
                        100,
                        Math.round((stats.total / goal) * 100)
                      )}
                      %
                    </div>
                  </div>

                  <div className="sf-progress">
                    <span
                      style={{
                        width:
                          Math.min(
                            100,
                            (stats.total / goal) * 100
                          ) + '%',
                      }}
                    />
                  </div>

                  <label className="sf-goal-setting">
                    Тижнева ціль

                    <select value={goal} onChange={changeGoal}>
                      {[300, 600, 900, 1200, 1800, 2400].map(
                        (value) => (
                          <option key={value} value={value}>
                            {value / 60} год
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </section>

                <div className="sf-mini">
                  <span>◷</span>
                  <strong>{stats.streak}</strong>
                  <small>днів поспіль</small>
                </div>

                <div className="sf-mini sand">
                  <span>▤</span>
                  <strong>{tracker.subjects.length}</strong>
                  <small>предметів</small>
                </div>
              </div>

              <div className="sf-home-grid">
                <section className="sf-card sf-chart">
                  <div className="sf-card-head">
                    <div>
                      <span className="sf-eyebrow">
                        ТВОЯ АКТИВНІСТЬ
                      </span>

                      <h2>Навчання за тиждень</h2>
                    </div>

                    <a href="#/analytics">Детальніше ↗</a>
                  </div>

                  <div className="sf-bars">
                    {[...stats.perDay].reverse().map(
                      (minutes, index) => (
                        <div key={index}>
                          <span
                            title={`${minutes} хв`}
                            style={{
                              height:
                                Math.max(
                                  5,
                                  (minutes /
                                    Math.max(
                                      ...stats.perDay,
                                      60
                                    )) *
                                    100
                                ) + '%',
                            }}
                          />

                          <small>
                            {
                              [
                                'Пн',
                                'Вт',
                                'Ср',
                                'Чт',
                                'Пт',
                                'Сб',
                                'Нд',
                              ][index]
                            }
                          </small>
                        </div>
                      )
                    )}
                  </div>
                </section>

                <section className="sf-card sf-next">
                  <div className="sf-card-head">
                    <div>
                      <span className="sf-eyebrow">
                        НЕ ВТРАЧАЙ ТЕМП
                      </span>

                      <h2>Швидкі дії</h2>
                    </div>
                  </div>

                  <a href="#/subjects">
                    <span>＋</span>
                    <div>
                      <strong>Додати предмет</strong>
                      <small>Нова навчальна ціль</small>
                    </div>
                    ↗
                  </a>

                  <a href="#/journal">
                    <span>◷</span>
                    <div>
                      <strong>Записати заняття</strong>
                      <small>Збережи свій прогрес</small>
                    </div>
                    ↗
                  </a>

                  <a href="#/tasks">
                    <span>☑</span>
                    <div>
                      <strong>Мої завдання</strong>
                      <small>План на сьогодні</small>
                    </div>
                    ↗
                  </a>
                </section>
              </div>

              <div className="sf-home-note">
                ✦{' '}
                <span>
                  Маленький прогрес щодня створює великі
                  результати.
                </span>

                <a href="#/tips">Рекомендації →</a>
              </div>
            </>
          ) : (
            <>
              <div className="sf-page-heading">
                <span className="sf-eyebrow">
                  STUDYFLOW / {heading.toUpperCase()}
                </span>

                <h1>{heading}</h1>

                <p>
                  {page === 'account'
                    ? 'Налаштуй свій особистий простір.'
                    : 'Твій прогрес, твій ритм, твої результати.'}
                </p>
              </div>

              {page === 'subjects' && (
                <Tracker tracker={tracker} stats={stats} />
              )}

              {page === 'journal' && (
                <Journal tracker={tracker} />
              )}

              {page === 'analytics' && (
                <>
                  <div className="app-extras-visible">
                    <ExtraDashboard
                      tracker={tracker}
                      activePanel="analytics"
                    />
                  </div>

                  <button
                    className="sf-button"
                    onClick={exportStatistics}
                  >
                    ↓ Експорт CSV
                  </button>
                </>
              )}

              {['timer', 'tasks', 'calendar', 'tips'].includes(
                page
              ) && (
                <div className="app-extras-visible">
                  <ExtraDashboard
                    tracker={tracker}
                    activePanel={page}
                  />
                </div>
              )}

              {page === 'account' && (
                <Account user={user} setUser={setUser} />
              )}
            </>
          )}
        </main>

        <footer className="app-footer">
          © 2026 StudyFlow · Створено для твого прогресу
        </footer>
      </div>
    </div>
  );
}
