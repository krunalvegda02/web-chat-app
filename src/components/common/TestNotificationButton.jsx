import { Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { notificationService } from '../../services/notificationService';

export default function TestNotificationButton() {
  const testNotification = () => {
    console.log('🧪 Testing notification...');
    console.log('Permission:', Notification.permission);
    
    if (Notification.permission === 'granted') {
      notificationService.showNotification('Test Notification', {
        body: 'This is a test notification',
        icon: '/logo192.png'
      });
    } else {
      console.error('Permission not granted');
      alert('Notification permission not granted!');
    }
  };

  return (
    <Button
      type="primary"
      icon={<BellOutlined />}
      onClick={testNotification}
      style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 1000 }}
    >
      Test Notification
    </Button>
  );
}
