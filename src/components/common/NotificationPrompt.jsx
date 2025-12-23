import { useEffect } from 'react';
import { Button, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationPrompt() {
  const { permission, requestPermission } = useNotifications();

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      message.success('Notifications enabled! You will now receive message alerts.');
    } else {
      message.error('Notification permission denied');
    }
  };

  if (permission === 'granted') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      zIndex: 1000,
      background: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '300px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <BellOutlined style={{ fontSize: '24px', color: '#008069' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Enable Notifications</div>
          <div style={{ fontSize: '12px', color: '#667781' }}>
            Get notified of new messages
          </div>
        </div>
      </div>
      <Button 
        type="primary" 
        block 
        onClick={handleEnable}
        style={{ backgroundColor: '#008069', borderColor: '#008069' }}
      >
        Enable
      </Button>
    </div>
  );
}
