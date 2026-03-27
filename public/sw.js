importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const CACHE_NAME = 'goplanning-cache-v19';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Initialize Firebase inside the Service Worker
firebase.initializeApp({
  projectId: "goplanning-audiovisual-church",
  appId: "1:666333207200:web:588efe3377a2132e37c7c5",
  storageBucket: "goplanning-audiovisual-church.firebasestorage.app",
  apiKey: "AIzaSyDcdRO6qRxEIXwDeY2JKWQjW5QrL0CxT50",
  authDomain: "goplanning-audiovisual-church.firebaseapp.com",
  messagingSenderId: "666333207200",
});

const messaging = firebase.messaging();

// General PWA Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Cache management
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch logic
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// ---------------------------------------------------------
// OFFICIAL FIREBASE BACKGROUND MESSAGE HANDLER
// ---------------------------------------------------------
// This handles messages specifically from Firebase when app is closed.
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'GoPlanning Update';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva actualización.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      url: payload.data?.url || (payload.fcmOptions?.link) || '/'
    },
    tag: payload.data?.tag || 'default',
    renotify: true,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});


// ---------------------------------------------------------
// NOTIFICATION INTERACTION HANDLERS
// ---------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.js] Notification clicked:', event.notification.data);
  event.notification.close();

  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Try to find a window already pointing to this URL
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. Try to find any app window and navigate it
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('navigate' in client) {
          return client.navigate(urlToOpen).then(c => c?.focus());
        }
      }
      // 3. Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
