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
      console.log('🔧 [SW] Registering service worker...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ [SW] Service Worker registered:', registration);
      await navigator.serviceWorker.ready;
      console.log('✅ [SW] Service Worker ready');
      return registration;
    } catch (error) {
      console.error('❌ [SW] Service Worker registration failed:', error);
      throw error;
    }
  }

  async getFCMToken() {
    if (!messaging) {
      console.warn('⚠️ [FCM] Firebase messaging not initialized');
      return null;
    }

    try {
      console.log('🔑 [FCM] Requesting FCM token...');
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (currentToken) {
        console.log('✅ [FCM] Token obtained:', currentToken.substring(0, 20) + '...');
        this.token = currentToken;
        store.dispatch(setFCMToken(currentToken));
        await this.saveFCMToken(currentToken);
        return currentToken;
      } else {
        console.warn('⚠️ [FCM] No token received');
      }
      return null;
    } catch (error) {
      console.error('❌ [FCM] Error getting token:', error.message);
      console.warn('⚠️ [FCM] Push notifications will not work, but in-app notifications will still function');
      return null;
    }
  }

  async saveFCMToken(token) {
    try {
      console.log('📤 [FCM] Saving token to backend...');
      await store.dispatch(registerFCMToken({ fcmToken: token, platform: 'web' })).unwrap();
      console.log('✅ [FCM] Token saved to backend successfully');
    } catch (error) {
      console.error('❌ [FCM] Error saving token to backend:', error);
    }
  }

  setupForegroundListener(onNotification) {
    if (!messaging) {
      console.error('❌ Cannot setup listener - messaging not initialized');
      return;
    }

    console.log('🎯 Setting up foreground listener...');
    console.log('🔍 [SERVICE] onNotification callback provided:', !!onNotification);
    console.log('🔍 [SERVICE] Document visibility:', document.hidden ? 'hidden' : 'visible');

    onMessage(messaging, (payload) => {
      console.log('📢 [SERVICE] ===== FCM MESSAGE RECEIVED =====');
      console.log('📬 [SERVICE] Full payload:', JSON.stringify(payload, null, 2));
      console.log('🔍 [SERVICE] Document hidden:', document.hidden);
      console.log('🔍 [SERVICE] Has callback:', !!onNotification);
      
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
      
      console.log('🔔 [SERVICE] Notification data prepared:', notificationData);
      
      // Show custom notification if callback provided
      if (onNotification) {
        console.log('✅ [SERVICE] Calling onNotification callback');
        onNotification(notificationData);
        console.log('✅ [SERVICE] Callback executed');
      } else if (document.hidden) {
        // Fallback to browser notification if tab is hidden
        console.log('📱 [SERVICE] Showing browser notification (tab hidden)');
        new Notification(notificationData.title, {
          body: notificationData.body,
          icon: notificationData.avatar,
          tag: `msg-${notificationData.messageId}`
        });
      } else {
        console.log('⚠️ [SERVICE] No notification callback and tab is visible - notification not shown');
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
