const CACHE_NAME = 'goplanning-cache-v4';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/globals.css',
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Delete old caches
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first approach for HTML/Navigation, Cache-fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for other assets (images, css, etc)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request).then((fetchResponse) => {
          return fetchResponse;
        });
      })
  );
});

// Push Notifications Handling
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Nuevo mensaje de GoPlanning',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
          url: data.url || '/'
        },
        vibrate: [100, 50, 100],
        requireInteraction: true
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'GoPlanning', options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
