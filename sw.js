const CACHE_NAME = 'classpanel-v6';
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
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === location.origin) {
    const isHtmlNavigation = event.request.mode === 'navigate' ||
      (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

    // 1. HTML PAGES: NETWORK-FIRST (Always fetch freshest live page; fallback to cache if offline)
    if (isHtmlNavigation) {
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
            // Offline fallback: serve cached page or root
            const cached = await caches.match(event.request);
            if (cached) return cached;
            return caches.match('/');
          })
      );
      return;
    }

    // 2. STATIC ASSETS: Stale-While-Revalidate with background revalidation
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
