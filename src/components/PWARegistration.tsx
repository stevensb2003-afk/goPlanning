"use client";

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Unified GoPlanning Service Worker registered:', registration.scope);
            
            // Check for updates periodically when the app is focused
            window.addEventListener('focus', () => {
              registration.update();
            });

            // If a new service worker is waiting, skip waiting immediately
            // or notify the user. Here we'll try to update silently on next load.
            if (registration.waiting) {
              console.log('New version found and waiting. Refresh to apply!');
            }
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });

      // Handle the activation of a new service worker (v7)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('New Service Worker activated. Reloading for stability...');
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}

