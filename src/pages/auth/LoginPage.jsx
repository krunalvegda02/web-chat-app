import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Checkbox, Typography, Alert } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { login, clearError } from '../../redux/slices/authSlice.jsx';
import { useTheme } from '../../hooks/useTheme';

const { Title, Text } = Typography;

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { loading, error, user, token } = useSelector((s) => s.auth);
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(false);

  console.log('🔐 [LoginPage] Rendered. Auth state:', {
    loading,
    hasError: !!error,
    hasUser: !!user,
    hasToken: !!token,
    userRole: user?.role,
  });

  // Load saved credentials if "Remember Me" was selected
  useEffect(() => {
    const saved = localStorage.getItem('loginCredentials');
    if (saved) {
      try {
        const { identifier, rememberMe: wasRemembered } = JSON.parse(saved);
        if (wasRemembered) {
          form.setFieldsValue({ identifier });
          setRememberMe(true);
        }
      } catch (e) {
        console.error('Failed to parse saved credentials:', e);
      }
    }
  }, [form]);

  // Handle standard login
  const handleLogin = async (values) => {
    try {
      const identifier = values.identifier.trim();
      const isEmail = identifier.includes('@');
      
      const loginData = {
        password: values.password,
        ...(isEmail ? { email: identifier } : { phone: identifier.replace(/\D/g, '') })
      };

      console.log('🔐 [LoginPage] Attempting login...', { isEmail });

      if (rememberMe) {
        localStorage.setItem(
          'loginCredentials',
          JSON.stringify({ identifier, rememberMe: true })
        );
      } else {
        localStorage.removeItem('loginCredentials');
      }

      const result = await dispatch(login(loginData));

      if (result.type === 'auth/login/fulfilled') {
        const { data } = result.payload;
        const loggedInUser = data.user;

        console.log('✅ [LoginPage] Login successful!', {
          userRole: loggedInUser.role,
          userEmail: loggedInUser.email,
        });

        setTimeout(() => {
          if (loggedInUser.role === 'PLATFORM_ADMIN') {
            navigate('/admin');
          } else if (loggedInUser.role === 'SUPER_ADMIN') {
            navigate('/super-admin/chats');
          } else {
            navigate('/user/chats');
          }
        }, 500);
      }
    } catch (err) {
      console.error('❌ [LoginPage] Login error:', err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-auto" style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }}>
      <Card className="w-full max-w-md shadow-lg" style={{ borderRadius: '12px', border: `1px solid ${theme?.borderColor || '#E9EDEF'}` }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔐</div>
          <Title level={2} style={{ color: theme?.primaryColor || '#008069', marginBottom: 8 }}>
            Admin Sign In
          </Title>
          <Text type="secondary">
            Sign in to access your administrative dashboard
          </Text>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Login Failed"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => dispatch(clearError())}
          />
        )}

        {/* Login Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            name="identifier"
            rules={[
              { required: true, message: 'Email or phone number is required' }
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="Admin Email or Phone number"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Enter password"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            >
              Remember me
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              block
              style={{ backgroundColor: theme?.primaryColor || '#008069', borderColor: theme?.primaryColor || '#008069' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
