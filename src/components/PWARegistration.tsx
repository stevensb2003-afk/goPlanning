"use client";

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('FCM Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('FCM Service Worker registration failed:', error);
          });
          
        // También registrar el SW principal si existe
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Main Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.log('Main Service Worker registration failed or not found:', error);
          });
      });
    }
  }, []);

  return null;
}
