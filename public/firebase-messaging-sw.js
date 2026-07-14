/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBe7XBQQeauHtZ6HO9rB47soTGN0kkdR5Y",
  authDomain: "webchatapp-bc952.firebaseapp.com",
  projectId: "webchatapp-bc952",
  storageBucket: "webchatapp-bc952.firebasestorage.app",
  messagingSenderId: "105671231398",
  appId: "1:105671231398:web:109b3b5e8d0ede65ae7167"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const { data } = payload;
  const title = data?.senderName || data?.title || 'New Message';
  const body = data?.body || 'You have a new message';
  const icon = data?.avatar || 'https://ui-avatars.com/api/?name=User&background=25D366&color=fff&size=128';

  return self.registration.showNotification(title, {
    body,
    icon,
    badge: '/whatsapp-icon.png',
    data: data || {},
    tag: `msg-${data?.messageId || Date.now()}`,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'reply',
        type: 'text',
        title: 'Reply',
        placeholder: 'Type a message...'
      }
    ]
  });
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked - Action:', event.action);

  const data = event.notification.data;
  const roomId = data?.roomId;
  const userRole = data?.userRole || 'USER';

  // Handle inline reply with text input
  if (event.action === 'reply') {
    if (event.reply) {
      console.log('[SW] Reply text:', event.reply);
      event.notification.close();

      // Send reply to app
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then((clientList) => {
            if (clientList.length > 0) {
              clientList[0].postMessage({
                type: 'SEND_REPLY',
                roomId,
                message: event.reply
              });
            }
            return Promise.resolve();
          })
      );
      return;
    }
  }

  // Handle notification body click - open chat
  event.notification.close();

  let chatPath = '/chat';
  if (userRole === 'SUPER_ADMIN') {
    chatPath = '/super-admin/chats';
  } else if (['PLATFORM_ADMIN'].includes(userRole)) {
    chatPath = '/admin/chats';
  }

  const url = roomId ? `${chatPath}?room=${roomId}` : chatPath;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            return client.focus().then(() => {
              client.postMessage({ type: 'OPEN_CHAT', roomId, userRole });
            });
          }
        }
        return clients.openWindow(url);
      })
  );
});
