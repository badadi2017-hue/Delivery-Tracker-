// Minimal service worker for Delivery Tracker.
// Intentionally does NOT cache aggressively — it only exists so the app
// is installable as a PWA. All real data lives in IndexedDB, not here.

const CACHE_NAME = 'delivery-tracker-v1';

self.addEventListener('install', (event) => {
  // Activate the new service worker immediately instead of waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first, no fallback caching of the main HTML — this avoids the
// browser ever serving a stale/broken cached copy of the app.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});