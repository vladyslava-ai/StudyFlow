import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { DAYS, keyDaysAgo } from "../lib/time.js";

// Увесь стан трекера. Дані та підсумки тижня надходять із REST API.
export function useTracker() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    const [subjectRows, sessionRows, weekStats] = await Promise.all([
      api.listSubjects(),
      api.listSessions(keyDaysAgo(DAYS - 1)),
      api.weekStats(),
    ]);
    setSubjects(subjectRows);
    setSessions(sessionRows);
    setStats(weekStats);
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      await fetchAll();
      setLoadError("");
      setStatus("ready");
    } catch (error) {
      setLoadError(error.message);
      setStatus("error");
    }
  }, [fetchAll]);

  useEffect(() => {
    load();
  }, [load]);

  // Виконує дію на сервері, потім оновлює дані та підсумки з API.
  // Повертає true, якщо все вдалося, щоб форма знала, чи очищати поля.
  const guard = (action) => async (...args) => {
    setBusy(true);
    setActionError("");
    try {
      await action(...args);
      await fetchAll();
      return true;
    } catch (error) {
      setActionError(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    subjects,
    sessions,
    stats,
    status,
    loadError,
    actionError,
    busy,
    reload: load,
    addSubject: guard((input) => api.addSubject(input)),
    removeSubject: guard((id) => api.deleteSubject(id)),
    addSession: guard((input) => api.addSession(input)),
    removeSession: guard((id) => api.deleteSession(id)),
  };
}
