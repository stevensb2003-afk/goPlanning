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
            
            // Periodically update silently
            setInterval(() => {
              registration.update().catch(() => {});
            }, 1000 * 60 * 60); // Every hour
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}

