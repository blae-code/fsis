// Lightweight localStorage cache for instant, offline-friendly restore.
// Backend (workspace_session entity) remains the source of truth; this is a fast mirror.
// Session data is scoped per-user so multiple accounts on the same browser stay isolated.

const BASE_KEYS = {
  session: 'fsis.session',
  booted: 'fsis.booted',
};

// Identifies the currently signed-in user so cached session data is namespaced to them.
let userScope = 'anon';

export function setCacheScope(scope) {
  userScope = scope || 'anon';
}

function scopedKey(key) {
  return `${key}.${userScope}`;
}

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
  getSession: () => read(scopedKey(BASE_KEYS.session)),
  setSession: (windows) => write(scopedKey(BASE_KEYS.session), windows),
  clearSession: () => {
    try { localStorage.removeItem(scopedKey(BASE_KEYS.session)); } catch { /* noop */ }
  },
  // Boot flag is per-browser (device-level), not per-user
  hasBooted: () => read(BASE_KEYS.booted) === true,
  markBooted: () => write(BASE_KEYS.booted, true),
};