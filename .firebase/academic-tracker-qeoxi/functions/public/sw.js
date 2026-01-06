
const CACHE_NAME = 'academic-tracker-cache-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/groups',
  '/bitacora',
  '/grades',
  '/attendance',
  '/participations',
  '/activities',
  '/semester-evaluation',
  '/records',
  '/reports',
  '/statistics',
  '/contact',
  '/settings',
  '/login',
  '/signup',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
