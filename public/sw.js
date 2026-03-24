importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const CACHE_NAME = 'goplanning-cache-v6';
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

// ROBUST NATIVE PUSH LISTENER
// This replaces onBackgroundMessage to ensure nothing is ignored.
self.addEventListener('push', (event) => {
  console.log('[sw.js] Push event received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[sw.js] Error parsing push data as JSON:', e);
      // Fallback to text if JSON fails
      data = { body: event.data.text() };
    }
  }

  console.log('[sw.js] Parsed push data:', data);

  // Extract fields from possible Firebase or Native structures
  const title = data.notification?.title || data.title || 'GoPlanning';
  const body = data.notification?.body || data.body || 'Tienes una nueva actualización.';
  
  // Use current origin for icons to avoid cross-origin issues
  const icon = '/favicon.svg';
  const badge = '/favicon.svg';
  
  // Extract URL for deep linking
  // Check multiple possible paths where FCM or custom scripts might put the URL
  const url = data.data?.url || data.url || (data.fcmOptions?.link) || '/';

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: badge,
    data: { url: url },
    tag: data.data?.tag || 'default',
    renotify: true,
    vibrate: [100, 50, 100],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Handle notification interaction
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

