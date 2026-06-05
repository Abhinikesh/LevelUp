const CACHE_NAME = 'stepup-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/favicon.ico',
];

// Install: Cache static resources
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first, fallback cache
self.addEventListener('fetch', (e) => {
  // Skip API requests or non-GET requests
  if (e.request.url.includes('/api/') || e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache new fetched assets dynamically
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => {
        // Serve from cache if offline
        return caches.match(e.request).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          // Return index.html for SPA routes
          if (e.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
