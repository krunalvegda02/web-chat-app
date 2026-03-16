import { useState } from 'react';
import { Button, Card, Input, Form, message, Spin, Alert } from 'antd';
import { WhatsAppOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';
import { copyToClipboardWithMessage } from '../../utils/clipboardUtils';

export default function WhatsAppTestPage() {
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Get platform ID from URL or environment
  const platformId = new URLSearchParams(window.location.search).get('platformId') || 
                     process.env.REACT_APP_PLATFORM_ID || 
                     'test-platform-id';

  const handleWhatsAppClick = async (values) => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🧪 [TEST] WhatsApp button clicked');
      console.log('🧪 [TEST] Platform ID:', platformId);
      console.log('🧪 [TEST] Form values:', values);

      // Simulate API call to create/get platform user
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/v1/platform/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformId,
          name: values.name,
          email: values.email,
          phone: values.phone,
        }),
      });

      const data = await response.json();
      console.log('🧪 [TEST] API Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create platform user');
      }

      setTestResult({
        success: true,
        message: 'Platform user created successfully!',
        data: data.data,
      });

      message.success('✅ Platform user created! Check console for details.');
      
      // Log the user data
      console.log('✅ [TEST] User created:', data.data);
      console.log('✅ [TEST] User ID:', data.data?.user?._id);
      console.log('✅ [TEST] Platform ID:', data.data?.user?.platformId);

    } catch (error) {
      console.error('❌ [TEST] Error:', error);
      setTestResult({
        success: false,
        message: error.message,
        error: error,
      });
      message.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    const success = await copyToClipboardWithMessage(
      text,
      message,
      'Copied to clipboard',
      'Failed to copy to clipboard'
    );
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6 border-0 shadow-lg" style={{ borderRadius: '12px' }}>
          <div className="text-center">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <WhatsAppOutlined style={{ color: '#25D366' }} />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: theme.sidebarTextColor || '#111B21' }}>
              WhatsApp Platform Test
            </h1>
            <p className="text-gray-600">
              Test the WhatsApp button integration for platform chats
            </p>
          </div>
        </Card>

        {/* Platform Info */}
        <Card className="mb-6 border-0 shadow-sm">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                Platform ID
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 rounded bg-gray-100 text-sm break-all">
                  {platformId}
                </code>
                <Button
                  type="text"
                  icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={() => copyToClipboard(platformId)}
                  size="small"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                API URL
              </p>
              <code className="block p-2 rounded bg-gray-100 text-sm break-all">
                {process.env.REACT_APP_API_URL || 'http://localhost:5000'}
              </code>
            </div>
          </div>
        </Card>

        {/* Test Form */}
        <Card className="mb-6 border-0 shadow-lg">
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.sidebarTextColor || '#111B21' }}>
            Create Test User
          </h2>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleWhatsAppClick}
            initialValues={{
              name: 'Test User',
              email: `test-${Date.now()}@example.com`,
              phone: '+1234567890',
            }}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: 'Name is required' }]}
            >
              <Input
                size="large"
                placeholder="Enter user name"
                style={{
                  borderRadius: '8px',
                  backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
                }}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input
                size="large"
                placeholder="Enter email"
                style={{
                  borderRadius: '8px',
                  backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
                }}
              />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: 'Phone is required' },
                { pattern: /^[+]?[0-9]{10,15}$/, message: 'Invalid phone number' },
              ]}
            >
              <Input
                size="large"
                placeholder="Enter phone number (e.g., +1234567890)"
                style={{
                  borderRadius: '8px',
                  backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                block
                icon={<WhatsAppOutlined />}
                style={{
                  backgroundColor: '#25D366',
                  borderColor: '#25D366',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                {loading ? 'Creating User...' : 'Create WhatsApp User'}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card className="border-0 shadow-lg">
            <Alert
              message={testResult.success ? '✅ Success' : '❌ Error'}
              description={testResult.message}
              type={testResult.success ? 'success' : 'error'}
              showIcon
              className="mb-4"
            />

            {testResult.success && testResult.data && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                    User Details
                  </p>
                  <pre className="p-3 rounded bg-gray-100 text-xs overflow-auto max-h-64">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold mb-1 text-gray-600">User ID</p>
                    <code className="block p-2 rounded bg-gray-100 text-xs break-all">
                      {testResult.data?.user?._id}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1 text-gray-600">Platform ID</p>
                    <code className="block p-2 rounded bg-gray-100 text-xs break-all">
                      {testResult.data?.user?.platformId}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1 text-gray-600">Email</p>
                    <code className="block p-2 rounded bg-gray-100 text-xs break-all">
                      {testResult.data?.user?.email}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1 text-gray-600">Phone</p>
                    <code className="block p-2 rounded bg-gray-100 text-xs break-all">
                      {testResult.data?.user?.phone}
                    </code>
                  </div>
                </div>

                <Alert
                  message="💡 Next Steps"
                  description={
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Check browser console for detailed logs</li>
                      <li>Verify user was created in database</li>
                      <li>Test chat functionality with this user</li>
                      <li>Check platform admin dashboard for new user</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />
              </div>
            )}

            {!testResult.success && (
              <Alert
                message="🔍 Debugging Tips"
                description={
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Check browser console for error details</li>
                    <li>Verify API URL is correct</li>
                    <li>Ensure backend server is running</li>
                    <li>Check network tab for API response</li>
                    <li>Verify platform ID is valid</li>
                  </ul>
                }
                type="warning"
                showIcon
              />
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6 border-0 shadow-sm" style={{ backgroundColor: '#E8F5E9' }}>
          <h3 className="font-bold mb-3">📋 Test Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Fill in the form with test user details</li>
            <li>Click "Create WhatsApp User" button</li>
            <li>Check the browser console (F12) for detailed logs</li>
            <li>Verify the response shows user created successfully</li>
            <li>Check that platformId is set correctly</li>
            <li>Go to Platform Admin dashboard to see the new user</li>
            <li>Test chat functionality with the created user</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
