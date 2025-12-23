import { messaging, getToken, onMessage } from '../config/firebase';
import store from '../redux/store';
import { registerFCMToken, setFCMToken, setPermission } from '../redux/slices/notificationSlice';

class NotificationService {
  constructor() {
    this.token = null;
    this.permission = Notification.permission;
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  async requestPermission(onNotification) {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      store.dispatch(setPermission(permission));
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        await this.registerServiceWorker();
        await this.getFCMToken();
        this.setupForegroundListener(onNotification);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker registered');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  async getFCMToken() {
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
      return null;
    }

    try {
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (currentToken) {
        console.log('✅ FCM Token obtained');
        this.token = currentToken;
        store.dispatch(setFCMToken(currentToken));
        await this.saveFCMToken(currentToken);
        return currentToken;
      }
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async saveFCMToken(token) {
    try {
      await store.dispatch(registerFCMToken({ fcmToken: token, platform: 'web' })).unwrap();
      console.log('✅ FCM token saved to backend');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  setupForegroundListener(onNotification) {
    if (!messaging) {
      console.error('❌ Cannot setup listener - messaging not initialized');
      return;
    }

    console.log('🎯 Setting up foreground listener...');

    onMessage(messaging, (payload) => {
      console.log('📬 FCM message received:', payload);
      
      const { data } = payload;
      const notificationData = {
        title: data?.title || data?.senderName || 'New Message',
        body: data?.body || 'You have a new message',
        avatar: data?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.senderName || 'User')}&background=25D366&color=fff&size=128`,
        senderName: data?.senderName || 'User',
        roomId: data?.roomId,
        senderId: data?.senderId,
        messageId: data?.messageId
      };
      
      // Show custom notification if callback provided, otherwise show browser notification
      if (onNotification) {
        onNotification(notificationData);
      } else if (document.hidden) {
        // Fallback to browser notification if tab is hidden
        new Notification(notificationData.title, {
          body: notificationData.body,
          icon: notificationData.avatar,
          tag: `msg-${notificationData.messageId}`
        });
      }
    });
    
    console.log('✅ Foreground listener setup complete');
  }

  showNotification(title, options = {}) {
    // Disabled - only use custom in-app notifications
    return;
  }

  isEnabled() {
    return this.permission === 'granted';
  }
}

export const notificationService = new NotificationService();
export default NotificationService;
