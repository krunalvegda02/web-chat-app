import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let messaging = null;

try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Firebase Messaging is not supported on iOS Safari (requires PWA + iOS 16.4+)
// Lazy-load it only when supported to prevent white screen crash
const isMessagingSupported = () => {
  try {
    return typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
  } catch (e) {
    return false;
  }
};

let _getToken = async () => null;
let _onMessage = () => () => {};

if (isMessagingSupported()) {
  import('firebase/messaging').then(({ getMessaging, getToken, onMessage }) => {
    try {
      messaging = getMessaging(app);
      _getToken = getToken;
      _onMessage = onMessage;
    } catch (e) {
      console.warn('Firebase messaging init failed:', e);
    }
  }).catch(e => console.warn('Firebase messaging load failed:', e));
}

export { messaging, _getToken as getToken, _onMessage as onMessage };
export default app;
