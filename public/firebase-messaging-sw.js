importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "goplanning-audiovisual-church",
  appId: "1:666333207200:web:588efe3377a2132e37c7c5",
  storageBucket: "goplanning-audiovisual-church.firebasestorage.app",
  apiKey: "AIzaSyDcdRO6qRxEIXwDeY2JKWQjW5QrL0CxT50",
  authDomain: "goplanning-audiovisual-church.firebaseapp.com",
  messagingSenderId: "666333207200",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'GoPlanning Update';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva actualización.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.notification?.tag || payload.data?.tag || 'notification-group',
    data: {
      url: payload.data?.url || '/'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
