const CACHE_NAME = 'classpanel-v31';
const STATIC_ASSETS = [
  '/',
  '/tools/',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/robots.txt',
  '/root.txt',
  '/llms.txt',
  '/assets/images/og-card.png',
  '/assets/images/mystery-box.png',
  '/assets/images/box.png',
  '/assets/css/main.css',
  '/assets/js/common.js',
  '/assets/js/audio.js',
  '/assets/js/storage.js',
  '/assets/js/confetti.js',
  '/assets/js/fullscreen.js',
  '/assets/js/i18n.js',
  '/assets/audio/digital-alarm.mp3',
  '/assets/audio/button-click.mp3',
  '/assets/audio/button-click.wav',
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
  '/assets/icons/rock-paper-scissors.png',
  '/assets/icons/coin-flip.png',
  '/assets/icons/dice-roller.png',
  '/assets/icons/color-picker.png',
  '/assets/icons/stopwatch.png',
  '/assets/icons/metronome.png',
  '/assets/icons/chess-timer.png',
  '/assets/icons/talking-clock.png',
  '/assets/icons/bomb-countdown.png',
  '/assets/icons/custom-timer.png',
  '/assets/icons/split-timer.png',
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
  '/tools/rock-paper-scissors/',
  '/tools/coin-flip/',
  '/tools/dice-roller/',
  '/tools/color-picker/',
  '/tools/stopwatch/',
  '/tools/metronome/',
  '/tools/chess-timer/',
  '/tools/talking-clock/',
  '/tools/bomb-countdown/',
  '/tools/custom-timer/',
  '/tools/split-timer/',
  '/blog/',
  '/blog/best-free-online-timer-for-studying-pomodoro/',
  '/blog/how-to-use-meditation-timer-for-mindfulness/',
  '/blog/rock-paper-scissors-rules-strategy-play-online/',
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
