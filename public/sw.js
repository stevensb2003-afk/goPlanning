importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const CACHE_NAME = 'goplanning-cache-v5';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/globals.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Initialize Firebase inside the Service Worker
firebase.initializeApp({
  projectId: "goplanning-audiovisual-church",
  appId: "1:666333207200:web:af524631eacff67f37c7c5",
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

// Unified Push Handling (Standard + Firebase)
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'GoPlanning';
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva actualización en tus tareas.',
    icon: '/icons/icon-192x192.png', // Premium Logo
    badge: '/icons/icon-192x192.png',
    data: {
      url: payload.data?.url || '/'
    },
    tag: payload.data?.tag || 'default',
    renotify: true,
    vibrate: [100, 50, 100],
    requireInteraction: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle standard push events (backup)
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      // Only show if it's not handled by Firebase (avoid double notifications)
      if (!data.from) { 
        const options = {
          body: data.body || 'Nuevo mensaje de GoPlanning',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          data: { url: data.url || '/' },
          vibrate: [100, 50, 100],
        };
        event.waitUntil(self.registration.showNotification(data.title || 'GoPlanning', options));
      }
    } catch (e) {
      console.error('Push error:', e);
    }
  }
});

// Deep Linking Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a matching window is already open, focus it
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

