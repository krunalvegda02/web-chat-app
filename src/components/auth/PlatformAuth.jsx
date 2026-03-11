import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Spin, Steps } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  KeyOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { usePlatformIntegration } from '../../hooks/usePlatformIntegration';
import { useTheme } from '../../hooks/useTheme';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

/**
 * Secure Platform Authentication Component
 * Handles platform integration login with proper security measures
 */
export default function PlatformAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  
  // Get API key from URL params or environment
  const urlApiKey = searchParams.get('apiKey');
  const envApiKey = import.meta.env.VITE_PLATFORM_API_KEY;
  const apiKey = urlApiKey || envApiKey || 'test-api-key';
  
  const {
    loading,
    error,
    isValidApiKey,
    platformChatLogin,
    validateUserData,
    clearError,
    securityUtils
  } = usePlatformIntegration(apiKey);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loginResult, setLoginResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Clear errors when form values change
  useEffect(() => {
    if (error || validationErrors.length > 0) {
      clearError();
      setValidationErrors([]);
    }
  }, [error, validationErrors, clearError]);
  
  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setCurrentStep(1); // Show validation step
      
      // Validate user data
      const validation = validateUserData(values);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setCurrentStep(0); // Go back to form
        return;
      }
      
      setCurrentStep(2); // Show authentication step
      
      // Prepare user data
      const userData = {
        name: values.name?.trim(),
        email: values.email?.trim().toLowerCase(),
        phone: values.phone?.replace(/\D/g, ''), // Remove non-digits
        password: values.password,
        externalUserId: values.externalUserId?.trim() || `ext_${Date.now()}`
      };
      
      console.log('🔐 [PlatformAuth] Submitting login request...');
      
      // Perform secure login
      const result = await platformChatLogin(userData);
      
      if (result.success) {
        setLoginResult(result.data);
        setCurrentStep(3); // Show success step
        
        // Redirect after a short delay
        setTimeout(() => {
          const redirectUrl = result.data.redirectUrl || '/user/chats';
          console.log('🔐 [PlatformAuth] Redirecting to:', redirectUrl);
          window.location.href = redirectUrl;
        }, 2000);
      } else {
        setCurrentStep(0); // Go back to form
      }
    } catch (err) {
      console.error('❌ [PlatformAuth] Submission error:', err);
      setCurrentStep(0); // Go back to form
    }
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} />} />
            <Title level={3} style={{ marginTop: 24, color: theme?.primaryColor }}>Validating Data</Title>
            <Text type="secondary">Checking your information...</Text>
          </div>
        );
        
      case 2:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} />} />
            <Title level={3} style={{ marginTop: 24, color: theme?.primaryColor }}>Authenticating</Title>
            <Text type="secondary">Creating secure session...</Text>
          </div>
        );
        
      case 3:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
            <Title level={3} style={{ color: '#52c41a' }}>Login Successful!</Title>
            <Paragraph style={{ marginBottom: 16 }}>
              Welcome, {loginResult?.user?.name}! You're being redirected to your chat.
            </Paragraph>
            <Text type="secondary">Redirecting in a moment...</Text>
          </div>
        );
        
      default:
        return (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
              <Title level={2} style={{ color: theme?.primaryColor, marginBottom: 8 }}>
                Secure Platform Login
              </Title>
              <Text type="secondary">
                Enter your details to access the chat platform
              </Text>
            </div>
            
            {/* API Key Status */}
            <Alert
              message={isValidApiKey ? "Secure Connection Established" : "Invalid API Key"}
              description={isValidApiKey ? 
                "Your connection is secured with a valid API key." : 
                "The provided API key is invalid or missing."
              }
              type={isValidApiKey ? "success" : "error"}
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert
                message="Validation Errors"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            {/* API Error */}
            {error && (
              <Alert
                message="Authentication Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={clearError}
                style={{ marginBottom: 16 }}
              />
            )}
            
            {/* Login Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
              disabled={!isValidApiKey}
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[
                  { required: true, message: 'Name is required' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                  { max: 50, message: 'Name must be less than 50 characters' }
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="Enter your full name"
                  maxLength={50}
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="Enter your email address"
                  type="email"
                />
              </Form.Item>
              
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Phone number is required' },
                  { 
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const cleanPhone = value.replace(/\D/g, '');
                      if (cleanPhone.length < 10) {
                        return Promise.reject('Phone number must be at least 10 digits');
                      }
                      if (cleanPhone.length > 15) {
                        return Promise.reject('Phone number must be less than 15 digits');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input
                  size="large"
                  prefix={<PhoneOutlined />}
                  placeholder="Enter your phone number"
                  type="tel"
                />
              </Form.Item>
              
              <Form.Item
                name="externalUserId"
                label="External User ID (Optional)"
                help="Your unique identifier from the external platform"
              >
                <Input
                  size="large"
                  prefix={<KeyOutlined />}
                  placeholder="External user ID (optional)"
                  maxLength={100}
                />
              </Form.Item>
              
              <Form.Item style={{ marginTop: 32 }}>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={loading}
                  disabled={!isValidApiKey}
                  block
                  style={{ 
                    backgroundColor: theme?.primaryColor || '#008069', 
                    borderColor: theme?.primaryColor || '#008069',
                    height: 48
                  }}
                >
                  {loading ? 'Authenticating...' : 'Secure Login'}
                </Button>
              </Form.Item>
            </Form>
            
            {/* Security Notice */}
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              backgroundColor: '#f6f8fa', 
              borderRadius: 8,
              border: '1px solid #e1e4e8'
            }}>
              <Text style={{ fontSize: 12, color: '#586069' }}>
                🔒 Your data is protected with enterprise-grade security. 
                This connection uses encrypted API keys and secure authentication protocols.
              </Text>
            </div>
          </>
        );
    }
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }}
    >
      <Card 
        className="w-full max-w-md shadow-lg" 
        style={{ 
          borderRadius: '12px', 
          border: `1px solid ${theme?.borderColor || '#E9EDEF'}` 
        }}
      >
        {/* Progress Steps */}
        {currentStep > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Steps current={currentStep} size="small">
              <Step title="Form" />
              <Step title="Validate" />
              <Step title="Authenticate" />
              <Step title="Success" />
            </Steps>
          </div>
        )}
        
        {renderStepContent()}
      </Card>
    </div>
  );
}