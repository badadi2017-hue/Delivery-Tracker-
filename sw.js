// Delivery Tracker — service worker
// Bump CACHE_VERSION whenever index.html / manifest / icons change,
// so returning users pick up the new version instead of a stale cache.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `delivery-tracker-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('delivery-tracker-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Same-origin app shell: cache-first, falling back to network,
    // and updating the cache in the background when possible.
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkResp) => {
            if (networkResp && networkResp.ok) {
              const clone = networkResp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkResp;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  } else {
    // Cross-origin (e.g. Google Fonts): network-first, cache as fallback.
    event.respondWith(
      fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.ok) {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResp;
        })
        .catch(() => caches.match(req))
    );
  }
});
