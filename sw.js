const CACHE_NAME = 'classpanel-v4';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/assets/css/main.css',
  '/assets/js/common.js',
  '/assets/js/audio.js',
  '/assets/js/storage.js',
  '/assets/js/confetti.js',
  '/assets/js/fullscreen.js',
  '/assets/icons/icon.svg',
  '/assets/icons/favicon.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/group-generator.png',
  '/assets/icons/exam-timer.png',
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching partial or offline fallback:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Handle same-origin requests with stale-while-revalidate / network fallback
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // If offline and request is an HTML page, return cached root or page
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return cachedResponse || caches.match('/');
          }
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
