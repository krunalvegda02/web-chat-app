import { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Alert, Divider } from 'antd';
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function NotificationDiagnostic() {
  const [permission, setPermission] = useState(Notification.permission);
  const [swStatus, setSwStatus] = useState('checking...');
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    checkServiceWorker();
  }, []);

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      setSwStatus(regs.length > 0 ? `${regs.length} registered` : 'none');
    } else {
      setSwStatus('not supported');
    }
  };

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, time: new Date().toLocaleTimeString() }]);
  };

  const testDirect = () => {
    try {
      const n = new Notification('Direct Test', { 
        body: 'This is a direct browser notification',
        requireInteraction: true,
        icon: '/logo192.png'
      });
      addResult('Direct Notification', true, 'Created successfully');
      setTimeout(() => n.close(), 5000);
    } catch (err) {
      addResult('Direct Notification', false, err.message);
    }
  };

  const testServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('Service Worker Test', {
        body: 'This is via service worker',
        requireInteraction: true,
        icon: '/logo192.png'
      });
      addResult('Service Worker Notification', true, 'Shown successfully');
    } catch (err) {
      addResult('Service Worker Notification', false, err.message);
    }
  };

  const requestPerm = async () => {
    const perm = await Notification.requestPermission();
    setPermission(perm);
    addResult('Permission Request', perm === 'granted', `Result: ${perm}`);
  };

  const unregisterSW = async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      await reg.unregister();
    }
    addResult('Unregister SW', true, `Unregistered ${regs.length} service workers`);
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={2}>🔔 Notification Diagnostic</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Status */}
          <div>
            <Text strong>Permission: </Text>
            <Text type={permission === 'granted' ? 'success' : 'danger'}>
              {permission}
            </Text>
            <br />
            <Text strong>Service Worker: </Text>
            <Text>{swStatus}</Text>
            <br />
            <Text strong>Browser: </Text>
            <Text>{navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}</Text>
          </div>

          <Divider />

          {/* System Check Alert */}
          {permission === 'granted' && (
            <Alert
              message="If tests pass but you don't see notifications, check:"
              description={
                <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                  <li><strong>macOS:</strong> System Preferences → Notifications → Chrome → Allow</li>
                  <li><strong>Windows:</strong> Settings → System → Notifications → Chrome → On</li>
                  <li><strong>Do Not Disturb:</strong> Make sure it's OFF</li>
                  <li><strong>Browser:</strong> Click 🔒 in address bar → Notifications → Allow</li>
                  <li><strong>Focus Assist (Windows):</strong> Turn OFF</li>
                </ul>
              }
              type="warning"
              showIcon
            />
          )}

          {/* Test Buttons */}
          <Space wrap>
            <Button 
              type="primary" 
              icon={<BellOutlined />} 
              onClick={requestPerm}
              disabled={permission === 'granted'}
            >
              Request Permission
            </Button>
            
            <Button onClick={testDirect} disabled={permission !== 'granted'}>
              Test Direct Notification
            </Button>
            
            <Button onClick={testServiceWorker} disabled={permission !== 'granted'}>
              Test Service Worker
            </Button>
            
            <Button danger onClick={unregisterSW}>
              Reset Service Worker
            </Button>
          </Space>

          <Divider />

          {/* Test Results */}
          <div>
            <Title level={4}>Test Results:</Title>
            {testResults.length === 0 ? (
              <Text type="secondary">No tests run yet</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {testResults.map((result, idx) => (
                  <Card key={idx} size="small">
                    <Space>
                      {result.success ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      )}
                      <div>
                        <Text strong>{result.test}</Text>
                        <br />
                        <Text type="secondary">{result.message}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>{result.time}</Text>
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </div>

          <Divider />

          {/* Manual Commands */}
          <div>
            <Title level={4}>Manual Test (Console):</Title>
            <Paragraph>
              <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4 }}>
{`// Test 1: Direct
new Notification('Test', { 
  body: 'Can you see this?',
  requireInteraction: true 
});

// Test 2: Check permission
console.log(Notification.permission);

// Test 3: Check system
console.log('macOS DND:', 
  Notification.permission === 'granted' && 
  document.visibilityState === 'visible'
);`}
              </pre>
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  );
}
