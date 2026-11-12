// Клієнт REST API. Усі запити до сервера FastAPI проходять через цей файл.
// Сайт віддається тим самим сервером, тому адреса починається з "/api".

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function describeError(status, data) {
  const detail = data && data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0];
    const field = first.loc && first.loc[first.loc.length - 1];
    return `Некоректне значення${field ? ` у полі «${field}»` : ""}: ${first.msg}`;
  }
  return `Сервер відповів помилкою ${status}`;
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Немає зв'язку із сервером. Запустіть backend (uvicorn) і оновіть сторінку.");
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* порожня або не JSON-відповідь */
  }
  if (!response.ok) throw new Error(describeError(response.status, data));
  return data;
}

export const api = {
  aiChat: (message) => request("/api/ai/chat", { method: "POST", body: { message } }),
  listSubjects: () => request("/api/subjects"),
  addSubject: ({ name, goalMinutes }) =>
    request("/api/subjects", { method: "POST", body: { name, goal_minutes: goalMinutes } }),
  deleteSubject: (id) => request(`/api/subjects/${id}`, { method: "DELETE" }),

  listSessions: (dateFrom) => request(`/api/sessions?date_from=${dateFrom}&limit=500`),
  addSession: ({ subjectId, minutes, note, studiedOn }) =>
    request("/api/sessions", {
      method: "POST",
      body: { subject_id: subjectId, minutes, note: note || null, studied_on: studiedOn },
    }),
  deleteSession: (id) => request(`/api/sessions/${id}`, { method: "DELETE" }),

  weekStats: () => request("/api/stats/week"),
  tasks: () => request("/api/tasks"),
  addTask: (body) => request("/api/tasks", { method: "POST", body }),
  patchTask: (id, body) => request(`/api/tasks/${id}`, { method: "PATCH", body }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: "DELETE" }),
  calendar: () => request("/api/calendar?days=90"),
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  profile: (body) => request("/api/profile", { method: "PATCH", body }),
  avatar: (image) => request("/api/profile/avatar", { method: "PUT", body: {image} }),
};
