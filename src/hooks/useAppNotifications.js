import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

export const useAppNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const notificationIdsRef = useRef(new Set());
  const { activeRoomId } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);

  // Remove notifications for active room
  useEffect(() => {
    if (activeRoomId) {
      setNotifications(prev => prev.filter(n => n.roomId !== activeRoomId));
    }
  }, [activeRoomId]);

  const handleNotification = useCallback((notification) => {
    const notifId = `${notification.senderId}-${notification.messageId}`;
    if (notificationIdsRef.current.has(notifId)) return;
    notificationIdsRef.current.add(notifId);
    
    // Show browser notification if tab is hidden
    if (document.hidden && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(notification.senderName || notification.title, {
          body: notification.body,
          icon: notification.avatar,
          badge: '/whatsapp-icon.png',
          tag: `msg-${notification.messageId}`,
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200],
          data: {
            roomId: notification.roomId,
            userRole: notification.userRole,
            messageId: notification.messageId,
            senderId: notification.senderId
          },
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
      return;
    }
    
    // Show in-app notification
    const newNotif = { ...notification, id: Date.now() };
    setNotifications(prev => [...prev, newNotif]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      notificationIdsRef.current.delete(notifId);
    }, 5000);
  }, []);

  // Listen for socket messages
  useEffect(() => {
    if (!user) return;

    const handleSocketMessage = (event) => {
      if (event.detail?.type === 'message_received' && event.detail?.message) {
        const message = event.detail.message;
        const currentUserId = user._id?.toString() || user._id;
        const senderId = message.senderId?._id?.toString() || message.senderId?.toString() || message.senderId;
        
        // Skip if viewing this chat or message is from current user
        if (activeRoomId === message.roomId || senderId === currentUserId) return;
        
        handleNotification({
          title: message.sender?.name || 'New Message',
          body: message.content || 'Sent a message',
          senderName: message.sender?.name || 'User',
          avatar: message.sender?.avatar || `https://ui-avatars.com/api/?name=User&background=25D366&color=fff`,
          roomId: message.roomId,
          senderId: senderId,
          messageId: message._id,
          userRole: user.role
        });
      }
    };

    window.addEventListener('socket_message', handleSocketMessage);
    return () => window.removeEventListener('socket_message', handleSocketMessage);
  }, [user, handleNotification, activeRoomId]);

  const closeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, handleNotification, closeNotification };
};
