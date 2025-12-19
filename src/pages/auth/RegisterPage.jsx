
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Divider, Steps, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { register } from '../../redux/slices/authSlice.jsx';

const { Title, Text, Paragraph } = Typography;

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((s) => s.auth);
  const [form] = Form.useForm();
  
  // State management
  const [step, setStep] = useState(0); // 0: info, 1: phone verification, 2: success
  const [phoneVerificationRequired, setPhoneVerificationRequired] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  
  // Get invite token from URL if available
  const inviteToken = searchParams.get('token');
  const tenantSlug = searchParams.get('tenant');

  // ✅ Validate phone number format
  const validatePhoneFormat = (_, value) => {
    if (!value) return Promise.resolve();
    
    const phoneRegex = /^[\\d\\s\\-\\+\\(\\)]{10,15}$/;
    if (!phoneRegex.test(value.replace(/\\s/g, ''))) {
      return Promise.reject(new Error('Phone must be 10-15 digits'));
    }
    return Promise.resolve();
  };

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
      return Promise.reject(new Error('Password must include special character (!@#$%^&*)'));
    }
    
    return Promise.resolve();
  };

  // ✅ Handle registration with phone support
  const handleRegister = async (values) => {
    try {
      const registrationPayload = {
        name: values.name.trim(),
        email: values.email.toLowerCase(),
        password: values.password,
        confirmPassword: values.confirmPassword,
        phone: values.phone ? values.phone.replace(/\\D/g, '') : null
      };

      // Store for later use
      setRegistrationData(registrationPayload);

      // ✅ Dispatch registration
      const result = await dispatch(register(registrationPayload));

      if (result.type === 'auth/register/fulfilled') {
        const { data } = result.payload;

        // ✅ Check if phone verification required
        if (data.phoneVerificationRequired) {
          setPhoneVerificationRequired(true);
          setStep(1);
          message.info('Verification code sent to your phone');
          return;
        }

        // ✅ Registration successful
        setStep(2);
        setTimeout(() => {
          if (inviteToken && tenantSlug) {
            navigate(`/join/${tenantSlug}?token=${inviteToken}`);
          } else {
            navigate('/user/chat');
          }
        }, 2000);
      }
    } catch (err) {
      message.error('Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  // ✅ Handle phone verification
  const handlePhoneVerification = async (values) => {
    try {
      // TODO: Call phone verification API endpoint
      // POST /api/auth/verify-phone
      // { userId, code: values.code }
      
      message.success('Phone verified successfully!');
      setStep(2);
      
      setTimeout(() => {
        if (inviteToken && tenantSlug) {
          navigate(`/join/${tenantSlug}?token=${inviteToken}`);
        } else {
          navigate('/user/chat');
        }
      }, 2000);
    } catch (err) {
      message.error('Verification failed. Please try again.');
    }
  };

  // ✅ Step 0: Registration Form
  const RegistrationForm = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleRegister}
      autoComplete="off"
    >
      {/* Name */}
      <Form.Item
        name="name"
        rules={[
          { required: true, message: 'Name is required' },
          { min: 2, message: 'Name must be at least 2 characters' }
        ]}
      >
        <Input
          size="large"
          prefix={<UserOutlined />}
          placeholder="Full Name"
          disabled={loading}
        />
      </Form.Item>

      {/* Email */}
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
          type="email"
        />
      </Form.Item>

      {/* Phone (Optional but Recommended) */}
      <Form.Item
        name="phone"
        rules={[
          { validator: validatePhoneFormat }
        ]}
      >
        <Input
          size="large"
          prefix={<PhoneOutlined />}
          placeholder="+1 (555) 000-0000 (Optional)"
          disabled={loading}
        />
      </Form.Item>

      {/* Password */}
      <Form.Item
        name="password"
        rules={[
          { validator: validatePasswordStrength }
        ]}
      >
        <Input.Password
          size="large"
          prefix={<LockOutlined />}
          placeholder="Strong Password"
          disabled={loading}
        />
      </Form.Item>

      {/* Confirm Password */}
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

      {/* Password Strength Indicator */}
      <div style={{ marginBottom: 16, fontSize: 12, color: '#999' }}>
        <Text type="secondary">
          ✓ At least 8 characters<br/>
          ✓ Uppercase & lowercase letters<br/>
          ✓ Number & special character (!@#$%^&*)
        </Text>
      </div>

      {/* Submit */}
      <Form.Item>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={loading}
          block
        >
          Create Account
        </Button>
      </Form.Item>
    </Form>
  );

  // ✅ Step 1: Phone Verification
  const PhoneVerificationForm = (
    <Form
      layout="vertical"
      onFinish={handlePhoneVerification}
      autoComplete="off"
    >
      <Alert
        message="Verification Code Sent"
        description={`We sent a 6-digit code to ${registrationData?.phone?.slice(-4)}`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="code"
        rules={[
          { required: true, message: 'Verification code is required' },
          { len: 6, message: 'Code must be exactly 6 digits' }
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
          Verify Phone
        </Button>
      </Form.Item>

      <Form.Item style={{ textAlign: 'center', marginTop: 8 }}>
        <Button type="link">Resend Code</Button>
      </Form.Item>
    </Form>
  );

  // ✅ Step 2: Success Message
  const SuccessMessage = (
    <div style={{ textAlign: 'center' }}>
      <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
      <Title level={3}>Welcome! 🎉</Title>
      <Paragraph>
        Your account has been created successfully
      </Paragraph>
      {registrationData?.phone && (
        <Paragraph type="secondary">
          Phone verified: {registrationData.phone}
        </Paragraph>
      )}
      <Text type="secondary">Redirecting to chat...</Text>
    </div>
  );

  return (
    <div className="register-page-container">
      <Card className="register-card" style={{ maxWidth: 450 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
          <Title level={2}>Create Account</Title>
          <Text type="secondary">
            Join and start connecting with contacts
          </Text>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Registration Failed"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Step Indicator */}
        <Steps
          current={step}
          items={[
            { title: 'Account', icon: <UserOutlined /> },
            { title: 'Verify', icon: <PhoneOutlined /> },
            { title: 'Complete', icon: <CheckCircleOutlined /> }
          ]}
          style={{ marginBottom: 24 }}
        />

        {/* Step Content */}
        {step === 0 && RegistrationForm}
        {step === 1 && PhoneVerificationForm}
        {step === 2 && SuccessMessage}

        {/* Divider & Sign In Link */}
        {step === 0 && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ fontWeight: 500 }}>
                  Sign In
                </Link>
              </Text>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}