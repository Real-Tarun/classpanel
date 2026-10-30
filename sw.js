const CACHE_NAME = 'classpanel-v34';
const STATIC_ASSETS = [
  '/',
  '/tools/',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/assets/css/main.css',
  '/assets/js/common.js',
  '/assets/js/audio.js',
  '/assets/js/storage.js',
  '/assets/js/fullscreen.js',
  '/assets/icons/logo.png',
  '/assets/icons/favicon.png',
  '/assets/icons/icon-192.png'
];

// Install Event: Cache assets and immediately activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('ClassPanel: Pre-caching partial or offline fallback:', err);
      });
    })
  );
});

// Activate Event: Clear all previous caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('ClassPanel: Clearing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED', cache: CACHE_NAME });
        });
      });
    })
  );
});

// Fetch Event: NETWORK-FIRST for all assets; NEVER cache admin or api routes
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never touch or cache /admin or /api endpoints in the service worker
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: serve cached resource if available
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const isHtmlNavigation = event.request.mode === 'navigate' ||
            (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));
          if (isHtmlNavigation) return caches.match('/');
        })
    );
  }
});
