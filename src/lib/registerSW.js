// Registers the FSIS service worker for PWA / offline support.
// In dev/preview, the SW is disabled and any stale registrations + caches are
// purged — a cached worker serving old JS chunks causes duplicate React copies.
export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
  if ('caches' in window) {
    caches.keys()
      .then((keys) => keys.forEach((k) => caches.delete(k)))
      .catch(() => {});
  }
}