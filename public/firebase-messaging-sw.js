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
  const title = data?.title || data?.senderName || 'New Message';
  const body = data?.body || 'You have a new message';
  const icon = data?.avatar || 'https://ui-avatars.com/api/?name=User&background=25D366&color=fff&size=128';
  
  return self.registration.showNotification(title, {
    body,
    icon,
    badge: 'https://img.icons8.com/color/96/whatsapp--v1.png',
    data: data || {},
    tag: `msg-${data?.messageId || Date.now()}`,
    requireInteraction: true,
    actions: [
      {
        action: 'reply',
        title: 'Reply',
        type: 'text',
        placeholder: 'Type a message...'
      },
      {
        action: 'open',
        title: 'Open'
      }
    ]
  });
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification, 'Action:', event.action);
  event.notification.close();

  const roomId = event.notification.data?.roomId;
  const senderId = event.notification.data?.senderId;
  
  if (event.action === 'reply' && event.reply) {
    // Handle inline reply
    const message = event.reply;
    console.log('[SW] Reply message:', message);
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Send message to any open client
          for (const client of clientList) {
            if (client.url.includes(self.location.origin)) {
              client.postMessage({
                type: 'SEND_REPLY',
                roomId,
                message,
                senderId
              });
              return client.focus();
            }
          }
          // If no client is open, open one
          return clients.openWindow(`/chat?room=${roomId}&reply=${encodeURIComponent(message)}`);
        })
    );
  } else {
    // Handle open action or notification click
    const url = roomId ? `/chat?room=${roomId}` : '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(self.location.origin)) {
              return client.focus().then(() => {
                client.postMessage({ type: 'OPEN_CHAT', roomId });
              });
            }
          }
          return clients.openWindow(url);
        })
    );
  }
});
