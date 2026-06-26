import { base44 } from '@/api/base44Client';

const recent = new Set();

function safeContext(context = {}) {
  try {
    return JSON.parse(JSON.stringify(context));
  } catch {
    return { note: 'Context could not be serialized' };
  }
}

export async function logDebugEvent({ severity = 'error', source = 'frontend', message, stack = '', context = {} }) {
  const text = String(message || 'Unknown diagnostic event').slice(0, 1200);
  const key = `${severity}:${source}:${text}`.slice(0, 300);
  if (recent.has(key)) return;
  recent.add(key);
  setTimeout(() => recent.delete(key), 30000);
  try {
    await base44.entities.debug_log.create({
      severity,
      source,
      message: text,
      stack: String(stack || '').slice(0, 5000),
      route: window.location.pathname + window.location.search,
      user_agent: navigator.userAgent,
      context: safeContext(context),
      resolved: false,
    });
  } catch {
    // Diagnostics must never interrupt the app.
  }
}