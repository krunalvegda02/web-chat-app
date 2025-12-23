import { useState, useEffect } from 'react';
import { Switch, Button, Card, message, Alert } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationSettings() {
  const { isEnabled, permission, requestPermission } = useNotifications();
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('notificationSound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const handleSoundToggle = (checked) => {
    setSoundEnabled(checked);
    localStorage.setItem('notificationSound', checked.toString());
    message.success(`Notification sound ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      message.success('Notifications enabled successfully!');
    } else {
      message.error('Notification permission denied');
    }
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEnabled ? <BellFilled style={{ color: '#008069' }} /> : <BellOutlined />}
          <span>Notification Settings</span>
        </div>
      }
      style={{ maxWidth: '600px', margin: '0 auto' }}
    >
      {permission === 'denied' && (
        <Alert
          message="Notifications Blocked"
          description="You have blocked notifications. Please enable them in your browser settings."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {permission === 'default' && (
        <Alert
          message="Enable Notifications"
          description="Get notified when you receive new messages, even when the app is in the background."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" type="primary" onClick={handleEnableNotifications}>
              Enable
            </Button>
          }
        />
      )}

      {isEnabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Push Notifications</div>
              <div style={{ fontSize: '12px', color: '#667781' }}>
                Receive notifications for new messages
              </div>
            </div>
            <Switch checked={isEnabled} disabled />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Notification Sound</div>
              <div style={{ fontSize: '12px', color: '#667781' }}>
                Play sound when receiving messages
              </div>
            </div>
            <Switch checked={soundEnabled} onChange={handleSoundToggle} />
          </div>
        </div>
      )}
    </Card>
  );
}
