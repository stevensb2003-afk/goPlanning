import { useState, useEffect } from 'react';
import { messaging, db } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { getDeviceId } from '@/lib/utils';

const VAPID_KEY = "BBpfTx4ihDQutDmC_mLV2cQVIqpU8uFQ7F1JsOOthh8qlvja-rk8n6MhqT8eoJGB9MQH4IDw-qoPFr8n-ioU5xQ";

export const usePushNotifications = (userId: string | undefined) => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (force = false) => {
    if (!userId || !messaging) return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      
      if (status === 'granted') {
        await syncToken(force);
      }
    } catch (error) {
      console.error('An error occurred while requesting permission:', error);
    }
  };

  const syncToken = async (force = false) => {
    if (!userId || !messaging || Notification.permission !== 'granted') return;

    try {
      // For iOS/Safari reliability, we explicitly register the service worker
      // and pass the registration object to getToken.
      let registration;
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (!registration) {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }
      }

      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (currentToken) {
        setToken(currentToken);
        const deviceId = getDeviceId();
        const userRef = doc(db, 'users', userId);
        
        // Use a map { deviceId: token } to ensure 1 token per device
        // This prevents duplicate notifications when tokens change or SW updates
        await updateDoc(userRef, {
          [`fcmTokensMap.${deviceId}`]: currentToken
        });
        
        console.log(`FCM Token synced for device: ${deviceId}`, force ? '(Forced)' : '');
        return currentToken;
      }
    } catch (error) {
      console.error('Error syncing FCM token:', error);
      throw error;
    }
  };

  return { token, permission, requestPermission, syncToken };
};


