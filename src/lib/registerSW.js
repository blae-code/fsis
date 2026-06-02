// Registers the FSIS service worker for PWA / offline support.
export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration is best-effort; app still works without it.
    });
  });
}