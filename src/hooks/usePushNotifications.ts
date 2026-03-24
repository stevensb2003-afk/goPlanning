import { useState, useEffect } from 'react';
import { messaging, db } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const VAPID_KEY = "BBpfTx4ihDQutDmC_mLV2cQVIqpU8uFQ7F1JsOOthh8qlvja-rk8n6MhqT8eoJGB9MQH4IDw-qoPFr8n-ioU5xQ";

export const usePushNotifications = (userId: string | undefined) => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!userId || !messaging) return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      
      if (status === 'granted') {
        await syncToken(); // Use the existing sync logic
      }
    } catch (error) {
      console.error('An error occurred while requesting permission:', error);
    }
  };

  const syncToken = async () => {
    if (!userId || !messaging || Notification.permission !== 'granted') return;

    try {
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      if (currentToken) {
        setToken(currentToken);
        // Save to Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(currentToken)
        });
        console.log('FCM Token synced successfully');
      }
    } catch (error) {
      console.error('Error syncing FCM token:', error);
    }
  };

  return { token, permission, requestPermission, syncToken };
};


