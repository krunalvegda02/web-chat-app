import { Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';

export default function QuickNotificationTest() {
  const test = () => {
    if (Notification.permission === 'granted') {
      new Notification('QUICK TEST', {
        body: 'If you see this, notifications work!',
        requireInteraction: true,
        icon: '/logo192.png'
      });
      alert('Notification sent! Check top-right of screen. If you dont see it, check system settings.');
    } else {
      Notification.requestPermission().then(p => {
        if (p === 'granted') {
          new Notification('QUICK TEST', {
            body: 'If you see this, notifications work!',
            requireInteraction: true,
            icon: '/logo192.png'
          });
          alert('Notification sent! Check top-right of screen.');
        } else {
          alert('Permission denied!');
        }
      });
    }
  };

  return (
    <Button
      type="primary"
      danger
      icon={<BellOutlined />}
      onClick={test}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        padding: '20px 30px',
        height: 'auto',
        fontSize: '16px'
      }}
    >
      TEST NOTIFICATION
    </Button>
  );
}
