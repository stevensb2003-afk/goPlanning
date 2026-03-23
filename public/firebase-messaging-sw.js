importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "goplanning-audiovisual-church",
  appId: "1:666333207200:web:af524631eacff67f37c7c5",
  storageBucket: "goplanning-audiovisual-church.firebasestorage.app",
  apiKey: "AIzaSyDcdRO6qRxEIXwDeY2JKWQjW5QrL0CxT50",
  authDomain: "goplanning-audiovisual-church.firebaseapp.com",
  messagingSenderId: "666333207200",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo-full.png',
    badge: '/favicon.png',
    data: payload.data,
    tag: payload.data?.type || 'default',
    renotify: true,
    vibrate: [200, 100, 200], // Vibración para mayor impacto
    actions: [
      { action: 'open', title: 'Ver detalles' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar el clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Si ya hay una ventana abierta, cambiarle el foco y navegar
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
