// FSIS service worker — network-first, offline fallback only.
// Never cache-first for JS/CSS or dev tooling paths to avoid serving stale chunks.
const CACHE_NAME = 'fsis-v2';
const DEV_PATHS = ['/src/', '/node_modules/', '/@vite', '/@react-refresh'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept non-GET, cross-origin, or dev tooling requests
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    DEV_PATHS.some((p) => url.pathname.startsWith(p))
  ) {
    return;
  }

  // Network-first; cache successful page navigations as an offline fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.mode === 'navigate') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
