
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Checkbox, Typography, Alert, Divider, Tabs, Tooltip } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';
import { login, clearError } from '../../redux/slices/authSlice.jsx';


const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form] = Form.useForm();
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [rememberMe, setRememberMe] = useState(false);
  const [requiresPhoneVerification, setRequiresPhoneVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const [lastPhone, setLastPhone] = useState(null);

  // ✅ Load saved credentials if "Remember Me" was selected
  useEffect(() => {
    const saved = localStorage.getItem('loginCredentials');
    if (saved) {
      try {
        const { email, rememberMe: wasRemembered } = JSON.parse(saved);
        if (wasRemembered) {
          form.setFieldsValue({ email });
          setRememberMe(true);
          setLoginMethod('email');
        }
      } catch (e) {
        console.error('Failed to parse saved credentials:', e);
      }
    }
  }, [form]);

  // ✅ Clear error when switching tabs
  useEffect(() => {
    dispatch(clearError());
  }, [loginMethod, dispatch]);

  // ✅ Handle login with email or phone
  const handleLogin = async (values) => {
    try {
      const loginData = {};

      if (loginMethod === 'email') {
        loginData.email = values.email;
      } else {
        // ✅ Normalize phone number
        loginData.phone = values.phone.replace(/\\D/g, '');
      }

      loginData.password = values.password;

      // ✅ Save credentials if Remember Me is checked
      if (rememberMe && loginMethod === 'email') {
        localStorage.setItem(
          'loginCredentials',
          JSON.stringify({
            email: values.email,
            rememberMe: true
          })
        );
      } else {
        localStorage.removeItem('loginCredentials');
      }

      // ✅ Dispatch login action
      const result = await dispatch(login(loginData));

      if (result.type === 'auth/login/fulfilled') {
        const { data } = result.payload;

        // ✅ Check if phone verification required
        if (data.requiresPhoneVerification) {
          setUserId(data.userId);
          setLastPhone(data.phone);
          setRequiresPhoneVerification(true);
          form.resetFields();
          return;
        }

        // ✅ Login successful - redirect based on role
        const { user } = data;
        if (user.role === 'ADMIN' || user.role === 'TENANT_ADMIN') {
          navigate('/admin');
        } else if (user.role === 'SUPER_ADMIN') {
          navigate('/super-admin');
        } else {
          navigate('/user/chat');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  // ✅ Tabs configuration
  const loginTabs = [
    {
      key: 'email',
      label: (
        <span>
          <MailOutlined /> Email
        </span>
      ),
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email format' }
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="your@email.com"
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
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'phone',
      label: (
        <Tooltip title="Login with registered phone number">
          <span>
            <PhoneOutlined /> Phone
          </span>
        </Tooltip>
      ),
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Phone is required' },
              {
                pattern: /^[\\d\\s\\-\\+\\(\\)]{10,15}$/,
                message: 'Invalid phone format'
              }
            ]}
          >
            <Input
              size="large"
              prefix={<PhoneOutlined />}
              placeholder="+1 (555) 000-0000"
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
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              block
            >
              Sign In with Phone
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  // ✅ Phone verification modal
  if (requiresPhoneVerification) {
    return (
      <div className="login-page-container">
        <Card className="login-card" style={{ maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2}>
              <PhoneOutlined /> Verify Phone
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
              <Button type="primary" size="large" htmlType="submit" block>
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
    <div className="login-page-container">
      <Card className="login-card" style={{ maxWidth: 450 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
          <Title level={2}>Sign In</Title>
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

        {/* Login Tabs */}
        <Tabs
          activeKey={loginMethod}
          onChange={(key) => {
            setLoginMethod(key);
            form.resetFields();
          }}
          items={loginTabs}
        />

        {/* Divider */}
        <Divider style={{ margin: '24px 0' }}>OR</Divider>

        {/* Additional Options */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Text type="secondary">
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 500 }}>
              Create one
            </Link>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 0 }}>
          <Link to="/auth/forgot-password" style={{ fontSize: 12 }}>
            Forgot password?
          </Link>
        </div>

        {/* Demo Hint */}
        <div style={{ marginTop: 24, padding: 12, background: '#fafafa', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 <strong>Demo:</strong> Use email or registered phone to login
          </Text>
        </div>
      </Card>
    </div>
  );
}