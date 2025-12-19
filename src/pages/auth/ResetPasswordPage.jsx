
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Divider, Steps, message, Tabs } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';


const { Title, Text, Paragraph } = Typography;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  
  // State management
  const [step, setStep] = useState(0); // 0: request, 1: verify, 2: reset, 3: success
  const [resetMethod, setResetMethod] = useState('email'); // 'email' or 'phone'
  const [resetToken, setResetToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Check if token provided in URL
  const tokenFromURL = searchParams.get('token');

  // ✅ Validate password strength
  const validatePasswordStrength = (_, value) => {
    if (!value) return Promise.reject(new Error('Password is required'));
    
    if (value.length < 8) {
      return Promise.reject(new Error('Password must be at least 8 characters'));
    }
    
    if (!/[A-Z]/.test(value)) {
      return Promise.reject(new Error('Password must include uppercase letter'));
    }
    
    if (!/[a-z]/.test(value)) {
      return Promise.reject(new Error('Password must include lowercase letter'));
    }
    
    if (!/[0-9]/.test(value)) {
      return Promise.reject(new Error('Password must include number'));
    }
    
    if (!/[!@#$%^&*]/.test(value)) {
      return Promise.reject(new Error('Password must include special character'));
    }
    
    return Promise.resolve();
  };

  // ✅ Handle password reset request (Step 0)
  const handleResetRequest = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const payload = resetMethod === 'email' 
        ? { email: values.email }
        : { phone: values.phone.replace(/\\D/g, '') };

      // TODO: Call POST /api/auth/forgot-password
      // const response = await api.post('/auth/forgot-password', payload);

      setStep(1);
      message.success(`Reset link sent to your ${resetMethod}`);
      form.resetFields();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
      message.error('Please try again');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle verification code (Step 1)
  const handleVerifyCode = async (values) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Call POST /api/auth/verify-reset-code
      // const response = await api.post('/auth/verify-reset-code', {
      //   code: values.code,
      //   method: resetMethod
      // });

      setResetToken(values.code);
      setStep(2);
      message.success('Code verified. Set your new password');
      form.resetFields();
    } catch (err) {
      setError('Invalid verification code');
      message.error('Please try again');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle password reset (Step 2)
  const handleResetPassword = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        token: resetToken || tokenFromURL,
        password: values.password,
        confirmPassword: values.confirmPassword
      };

      // TODO: Call POST /api/auth/reset-password
      // const response = await api.post('/auth/reset-password', payload);

      setStep(3);
      message.success('Password reset successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      message.error('Please try again');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 0: Request Reset
  const RequestResetForm = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleResetRequest}
      autoComplete="off"
    >
      <Tabs
        activeKey={resetMethod}
        onChange={(key) => {
          setResetMethod(key);
          form.resetFields();
          setError(null);
        }}
        items={[
          {
            key: 'email',
            label: <span><MailOutlined /> Email</span>,
            children: (
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Invalid email format' }
                ]}
              >
                <Input
                  size="large"
                  placeholder="your@email.com"
                  prefix={<MailOutlined />}
                  disabled={loading}
                />
              </Form.Item>
            )
          },
          {
            key: 'phone',
            label: <span><PhoneOutlined /> Phone</span>,
            children: (
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
                  placeholder="+1 (555) 000-0000"
                  prefix={<PhoneOutlined />}
                  disabled={loading}
                />
              </Form.Item>
            )
          }
        ]}
      />

      <Form.Item style={{ marginTop: 16 }}>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={loading}
          block
        >
          Send Reset Link
        </Button>
      </Form.Item>
    </Form>
  );

  // ✅ Step 1: Verify Code
  const VerifyCodeForm = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleVerifyCode}
      autoComplete="off"
    >
      <Alert
        message="Verification Code Sent"
        description={`Check your ${resetMethod} for the 6-digit code`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

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
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={loading}
          block
        >
          Verify Code
        </Button>
      </Form.Item>

      <Form.Item style={{ textAlign: 'center', marginTop: 8 }}>
        <Button type="link">Resend Code</Button>
      </Form.Item>
    </Form>
  );

  // ✅ Step 2: Reset Password
  const ResetPasswordForm = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleResetPassword}
      autoComplete="off"
    >
      <Form.Item
        name="password"
        rules={[
          { validator: validatePasswordStrength }
        ]}
      >
        <Input.Password
          size="large"
          prefix={<LockOutlined />}
          placeholder="New Password"
          disabled={loading}
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        rules={[
          { required: true, message: 'Please confirm password' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match'));
            }
          })
        ]}
      >
        <Input.Password
          size="large"
          prefix={<LockOutlined />}
          placeholder="Confirm Password"
          disabled={loading}
        />
      </Form.Item>

      <div style={{ marginBottom: 16, fontSize: 12, color: '#999' }}>
        <Text type="secondary">
          ✓ At least 8 characters<br/>
          ✓ Uppercase & lowercase<br/>
          ✓ Number & special character
        </Text>
      </div>

      <Form.Item>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={loading}
          block
        >
          Reset Password
        </Button>
      </Form.Item>
    </Form>
  );

  // ✅ Step 3: Success
  const SuccessMessage = (
    <div style={{ textAlign: 'center' }}>
      <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
      <Title level={3}>Password Reset ✅</Title>
      <Paragraph>
        Your password has been reset successfully
      </Paragraph>
      <Text type="secondary">Redirecting to login...</Text>
    </div>
  );

  // If token in URL, skip to reset password step
  if (tokenFromURL && step === 0) {
    return (
      <div className="reset-password-container">
        <Card className="reset-card" style={{ maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <LockOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <Title level={2}>Reset Password</Title>
          </div>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}

          <Steps
            current={2}
            items={[
              { title: 'Request' },
              { title: 'Verify' },
              { title: 'Reset', icon: <LockOutlined /> }
            ]}
            style={{ marginBottom: 24 }}
          />

          {ResetPasswordForm}

          <Divider style={{ margin: '24px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <Link to="/login">Back to Login</Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <Card className="reset-card" style={{ maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <LockOutlined style={{ fontSize: 32, marginBottom: 8 }} />
          <Title level={2}>Reset Password</Title>
          <Text type="secondary">
            We'll help you regain access to your account
          </Text>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Steps */}
        <Steps
          current={step}
          items={[
            { title: 'Request', icon: <MailOutlined /> },
            { title: 'Verify', icon: <PhoneOutlined /> },
            { title: 'Reset', icon: <LockOutlined /> },
            { title: 'Complete', icon: <CheckCircleOutlined /> }
          ]}
          style={{ marginBottom: 24 }}
        />

        {/* Step Content */}
        {step === 0 && RequestResetForm}
        {step === 1 && VerifyCodeForm}
        {step === 2 && ResetPasswordForm}
        {step === 3 && SuccessMessage}

        {/* Navigation */}
        {step < 3 && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Link to="/login">Back to Login</Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}