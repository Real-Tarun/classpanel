const CACHE_NAME = 'classpanel-v11';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/robots.txt',
  '/root.txt',
  '/assets/css/main.css',
  '/assets/js/common.js',
  '/assets/js/audio.js',
  '/assets/js/storage.js',
  '/assets/js/confetti.js',
  '/assets/js/fullscreen.js',
  '/assets/icons/logo.png',
  '/assets/icons/icon.svg',
  '/assets/icons/favicon.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/classroom-timer.png',
  '/assets/icons/random-name-picker.png',
  '/assets/icons/group-generator.png',
  '/assets/icons/exam-timer.png',
  '/assets/icons/sensory-timer.png',
  '/assets/icons/clocks.png',
  '/assets/icons/random-number-generator.png',
  '/assets/icons/chance-games.png',
  '/assets/icons/tally-counter.png',
  '/assets/icons/presentation-timer.png',
  '/assets/icons/race-timers.png',
  '/assets/icons/holiday-timers.png',
  '/tools/classroom-timer/',
  '/tools/race-timers/',
  '/tools/holiday-timers/',
  '/tools/random-name-picker/',
  '/tools/random-number-generator/',
  '/tools/sensory-timer/',
  '/tools/clocks/',
  '/tools/exam-timer/',
  '/tools/chance-games/',
  '/tools/group-generator/',
  '/tools/presentation-timer/',
  '/tools/tally-counter/',
  '/blog/',
  '/about/',
  '/privacy/',
  '/contact/'
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

// Fetch Event: NETWORK-FIRST for all assets (Ensures normal refresh always shows freshest changes immediately; falls back to cache offline)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

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
