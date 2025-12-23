import { useState, useCallback } from 'react';
import WhatsAppNotification from './WhatsAppNotification';

export default function NotificationManager({ onReply }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <div className="fixed top-0 right-0 z-[9999] pointer-events-none">
      <div className="flex flex-col gap-3 p-4 pointer-events-auto">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ marginTop: index * 10 }}
          >
            <WhatsAppNotification
              notification={notification}
              onClose={() => removeNotification(notification.id)}
              onReply={onReply}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export { addNotification };
