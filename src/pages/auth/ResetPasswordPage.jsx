
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Form, Input, Button, Card, Typography, Alert, Divider, Steps, message, Tabs } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { forgotPassword, verifyResetOTP, resetPassword } from '../../redux/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import OTPInput from '../../components/common/OTPInput';

const { Title, Text, Paragraph } = Typography;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  
  const [step, setStep] = useState(0);
  const [resetMethod, setResetMethod] = useState('email');
  const [resetIdentifier, setResetIdentifier] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const tokenFromURL = searchParams.get('token');
  const primaryColor = theme?.primaryColor || '#008069';
  const bgColor = theme?.sidebarBackgroundColor || '#F0F2F5';
  const borderColor = theme?.borderColor || '#E9EDEF';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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
        : { phone: values.phone.replace(/\D/g, '') };

      await dispatch(forgotPassword(payload)).unwrap();

      setResetIdentifier(resetMethod === 'email' ? values.email : values.phone.replace(/\D/g, ''));
      setStep(1);
      setResendTimer(30);
      message.success(`OTP sent to your ${resetMethod}`);
      form.resetFields();
    } catch (err) {
      setError(err || 'Failed to send OTP');
      message.error('Please try again');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle verification code (Step 1)
  const handleVerifyCode = async () => {
    if (otp.length !== 6) {
      message.error('Please enter 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        [resetMethod]: resetIdentifier,
        otp
      };

      await dispatch(verifyResetOTP(payload)).unwrap();

      setStep(2);
      message.success('OTP verified! Enter your new password');
    } catch (err) {
      setError(err || 'Invalid or expired OTP');
      message.error(err || 'Invalid or expired OTP');
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
        [resetMethod]: resetIdentifier,
        otp,
        password: values.password,
        confirmPassword: values.confirmPassword
      };

      await dispatch(resetPassword(payload)).unwrap();

      setStep(3);
      message.success('Password reset successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err || 'Failed to reset password');
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
        <Button type="primary" size="large" htmlType="submit" loading={loading} block style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
          Send Reset Link
        </Button>
      </Form.Item>
    </Form>
  );

  // ✅ Step 1: Verify Code
  const VerifyCodeForm = (
    <div>
      <Alert
        message="OTP Sent Successfully"
        description={`Check your ${resetMethod} for the 6-digit code`}
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <div style={{ marginBottom: 24 }}>
        <OTPInput value={otp} onChange={setOtp} disabled={loading} />
      </div>

      <Button 
        type="primary" 
        size="large" 
        onClick={handleVerifyCode} 
        loading={loading} 
        block 
        style={{ backgroundColor: primaryColor, borderColor: primaryColor, marginBottom: 12 }}
      >
        Continue
      </Button>

      <div style={{ textAlign: 'center' }}>
        <Button 
          type="link" 
          disabled={resendTimer > 0}
          style={{ color: resendTimer > 0 ? '#999' : primaryColor }} 
          onClick={async () => {
            setOtp('');
            const payload = resetMethod === 'email' 
              ? { email: resetIdentifier }
              : { phone: resetIdentifier };
            try {
              setLoading(true);
              await dispatch(forgotPassword(payload)).unwrap();
              setResendTimer(30);
              message.success('OTP resent successfully');
            } catch (err) {
              message.error('Failed to resend OTP');
            } finally {
              setLoading(false);
            }
          }}
        >
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </Button>
      </div>
    </div>
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
        <Button type="primary" size="large" htmlType="submit" loading={loading} block style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
          Reset Password
        </Button>
      </Form.Item>
    </Form>
  );

  const SuccessMessage = (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <CheckCircleOutlined style={{ fontSize: 64, color: primaryColor, marginBottom: 16 }} />
      <Title level={3} style={{ color: primaryColor }}>Password Reset ✅</Title>
      <Paragraph>Your password has been reset successfully</Paragraph>
      <Text type="secondary">Redirecting to login...</Text>
    </div>
  );

  // If token in URL, skip to reset password step
  if (tokenFromURL && step === 0) {
    return null; // OTP flow doesn't support URL tokens
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-auto p-4" style={{ backgroundColor: bgColor }}>
      <Card className="w-full max-w-md shadow-lg" style={{ borderRadius: '12px', border: `1px solid ${borderColor}` }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
          <Title level={2} style={{ color: primaryColor, marginBottom: 8 }}>Reset Password</Title>
          <Text type="secondary">We'll help you regain access</Text>
        </div>

        {error && (
          <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />
        )}

        <Steps current={step} items={[{ title: 'Request' }, { title: 'Verify' }, { title: 'Reset' }, { title: 'Done' }]} style={{ marginBottom: 24 }} size="small" responsive />

        {step === 0 && RequestResetForm}
        {step === 1 && VerifyCodeForm}
        {step === 2 && ResetPasswordForm}
        {step === 3 && SuccessMessage}

        {step < 3 && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: primaryColor }}>Back to Login</Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}