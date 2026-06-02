// Lightweight localStorage cache for instant, offline-friendly restore.
// Backend (workspace_session entity) remains the source of truth; this is a fast mirror.

const KEYS = {
  session: 'fsis.session',
  booted: 'fsis.booted',
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / unavailable — non-fatal */
  }
}

export const localCache = {
  getSession: () => read(KEYS.session),
  setSession: (windows) => write(KEYS.session, windows),
  clearSession: () => {
    try { localStorage.removeItem(KEYS.session); } catch { /* noop */ }
  },
  hasBooted: () => read(KEYS.booted) === true,
  markBooted: () => write(KEYS.booted, true),
};