
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Checkbox, Typography, Alert, Divider } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { login, clearError } from '../../redux/slices/authSlice.jsx';
import { useTheme } from '../../hooks/useTheme';


const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { loading, error, user, token } = useSelector((s) => s.auth);
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(false);
  const [requiresPhoneVerification, setRequiresPhoneVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const [lastPhone, setLastPhone] = useState(null);

  console.log('🔐 [LoginPage] Auth state:', {
    loading,
    hasError: !!error,
    hasUser: !!user,
    hasToken: !!token,
    userRole: user?.role,
  });

  // ✅ Load saved credentials if "Remember Me" was selected
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

  // ✅ Handle unified login (email or phone)
  const handleLogin = async (values) => {
    try {
      console.log('🔐 [LoginPage] handleLogin called');
      const identifier = values.identifier.trim();
      const isEmail = identifier.includes('@');
      
      const loginData = {
        password: values.password,
        ...(isEmail ? { email: identifier } : { phone: identifier.replace(/\D/g, '') })
      };

      console.log('🔐 [LoginPage] Login data:', {
        isEmail,
        identifier: isEmail ? identifier : '***',
      });

      // ✅ Save credentials if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem(
          'loginCredentials',
          JSON.stringify({ identifier, rememberMe: true })
        );
      } else {
        localStorage.removeItem('loginCredentials');
      }

      // ✅ Dispatch login action
      console.log('🔐 [LoginPage] Dispatching login action...');
      const result = await dispatch(login(loginData));

      console.log('🔐 [LoginPage] Login result:', {
        type: result.type,
        hasPayload: !!result.payload,
        payloadData: result.payload?.data ? {
          hasUser: !!result.payload.data.user,
          userRole: result.payload.data.user?.role,
          hasToken: !!result.payload.data.accessToken,
        } : null,
      });

      if (result.type === 'auth/login/fulfilled') {
        const { data } = result.payload;

        // ✅ Check if phone verification required
        if (data.requiresPhoneVerification) {
          console.log('🔐 [LoginPage] Phone verification required');
          setUserId(data.userId);
          setLastPhone(data.phone);
          setRequiresPhoneVerification(true);
          form.resetFields();
          return;
        }

        // ✅ Login successful - redirect based on role
        const { user } = data;
        console.log('✅ [LoginPage] Login successful!', {
          userRole: user.role,
          userEmail: user.email,
          userId: user._id,
        });
        
        // Use setTimeout to ensure Redux state is updated and persisted before navigation
        console.log('⏳ [LoginPage] Waiting 500ms before redirect...');
        setTimeout(() => {
          console.log('🔐 [LoginPage] Redirecting based on role:', user.role);
          if (user.role === 'PLATFORM_ADMIN') {
            console.log('🔐 [LoginPage] Redirecting PLATFORM_ADMIN to /admin');
            navigate('/admin');
          } else if (user.role === 'SUPER_ADMIN') {
            console.log('🔐 [LoginPage] Redirecting SUPER_ADMIN to /super-admin/chats');
            navigate('/super-admin/chats');
          } else if (user.role === 'USER') {
            console.log('🔐 [LoginPage] Redirecting USER to /user/chats');
            navigate('/user/chats');
          } else {
            console.log('🔐 [LoginPage] Unknown role, redirecting to /user/chats');
            navigate('/user/chats');
          }
        }, 500);
      } else {
        console.error('❌ [LoginPage] Login failed:', result.type, result.payload);
      }
    } catch (err) {
      console.error('❌ [LoginPage] Login error:', err);
    }
  };



  if (requiresPhoneVerification) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-auto" style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }}>
        <Card className="w-full max-w-md shadow-lg" style={{ borderRadius: '12px', border: `1px solid ${theme?.borderColor || '#E9EDEF'}` }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
            <Title level={2} style={{ color: theme?.primaryColor || '#008069', marginBottom: 8 }}>
              Verify Phone
            </Title>
            <Text type="secondary">
              We sent a verification code to {lastPhone}
            </Text>
          </div>

          <Alert
            message="Check your SMS for the verification code"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form layout="vertical" onFinish={(values) => {
            // TODO: Call phone verification endpoint
            console.log('Verify phone code:', values.code);
          }}>
            <Form.Item
              name="code"
              rules={[
                { required: true, message: 'Verification code is required' },
                { len: 6, message: 'Code must be 6 digits' }
              ]}
            >
              <Input
                size="large"
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" size="large" htmlType="submit" block style={{ backgroundColor: theme?.primaryColor || '#008069', borderColor: theme?.primaryColor || '#008069' }}>
                Verify & Continue
              </Button>
            </Form.Item>

            <Form.Item style={{ textAlign: 'center', marginTop: 8 }}>
              <Button
                type="link"
                onClick={() => {
                  setRequiresPhoneVerification(false);
                  form.resetFields();
                }}
                style={{ color: theme?.primaryColor || '#008069' }}
              >
                Back to Login
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-auto" style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }}>
      <Card className="w-full max-w-md shadow-lg" style={{ borderRadius: '12px', border: `1px solid ${theme?.borderColor || '#E9EDEF'}` }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💬</div>
          <Title level={2} style={{ color: theme?.primaryColor || '#008069', marginBottom: 8 }}>Sign In</Title>
          <Text type="secondary">
            Connect with contacts and start chatting
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
              { required: true, message: 'Email or phone is required' }
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="Email or phone number"
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
              Sign In
            </Button>
          </Form.Item>
        </Form>

        {/* Divider */}
        <Divider style={{ margin: '24px 0' }}>OR</Divider>

        {/* Additional Options */}
        {/* <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Text type="secondary">
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 500, color: theme?.primaryColor || '#008069' }}>
              Create one
            </Link>
          </Text>
        </div> */}

        <div style={{ textAlign: 'center', marginBottom: 0 }}>
          <Link to="/reset-password" style={{ fontSize: 12, color: theme?.primaryColor || '#008069' }}>
            Forgot password?
          </Link>
        </div>

      </Card>
    </div>
  );
}
