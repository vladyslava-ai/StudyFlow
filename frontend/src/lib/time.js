// Допоміжні функції для дат і часу. Дати зберігаються як рядки РРРР-ММ-ДД за місцевим часом.

export const DAYS = 7;

const pad = (n) => String(n).padStart(2, "0");

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function keyDaysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return dateKey(date);
}

// Скільки днів тому була дата (0 — сьогодні)
export function daysAgo(key) {
  const [y, m, d] = key.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} хв`;
  return m ? `${h} год ${m} хв` : `${h} год`;
}

export function pluralDays(n) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return "день";
  if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) return "дні";
  return "днів";
}

export function weekdayLabel(ago) {
  if (ago === 0) return "сьогодні";
  const date = new Date();
  date.setDate(date.getDate() - ago);
  return date.toLocaleDateString("uk-UA", { weekday: "short" });
}

export function dateLabel(key) {
  const ago = daysAgo(key);
  if (ago === 0) return "сьогодні";
  if (ago === 1) return "вчора";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("uk-UA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
