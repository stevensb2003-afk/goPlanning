import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  projectId: "goplanning-audiovisual-church",
  appId: "1:666333207200:web:af524631eacff67f37c7c5",
  storageBucket: "goplanning-audiovisual-church.firebasestorage.app",
  apiKey: "AIzaSyDcdRO6qRxEIXwDeY2JKWQjW5QrL0CxT50",
  authDomain: "goplanning-audiovisual-church.firebaseapp.com",
  messagingSenderId: "666333207200",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable persistence
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Firestore persistence failed-precondition');
    } else if (err.code == 'unimplemented') {
      console.warn('Firestore persistence unimplemented');
    }
  });
}

// Messaging is only supported in the browser
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

// We also export a version that works directly if we are in the browser
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { app, auth, db, messaging };
