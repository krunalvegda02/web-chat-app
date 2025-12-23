import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Card, message, Divider, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { registerWithInvite } from '../../redux/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';

const { Title, Text } = Typography;

export default function SignupWithInviteForm({ token, tenantId, inviteInfo }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { loading } = useSelector((s) => s.auth);
  const [form] = Form.useForm();
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    let strength = 0;
    
    if (pwd.length >= 6) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    setPasswordStrength(strength);
  };
  
  const onFinish = async (values) => {
    try {
      await dispatch(registerWithInvite({
        token,
        tenantId,
        name: values.name,
        password: values.password,
        confirmPassword: values.confirmPassword,
        phone: inviteInfo?.invitedPhone
      })).unwrap();
      
      message.success('Welcome! 🎉 Redirecting to dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      message.error(error || 'Registration failed');
    }
  };
  
  return (
    <Card className="w-full shadow-lg" style={{ borderRadius: '12px', border: `1px solid ${theme?.sidebarBorderColor || '#E9EDEF'}`, backgroundColor: theme?.sidebarBackgroundColor || '#FFFFFF' }}>
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">✉️</div>
        <Title level={3} style={{ color: theme?.primaryColor || '#008069', marginBottom: 8 }}>
          Join {inviteInfo?.tenantName}
        </Title>
        <Text style={{ color: theme?.timestampColor || '#667781', fontSize: '14px' }}>
          Complete your registration to get started
        </Text>
      </div>
      
      <Divider style={{ margin: '20px 0' }} />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        {/* Email - Read Only */}
        <Form.Item
          name="email"
          label={<span style={{ color: theme?.sidebarTextColor || '#111B21', fontWeight: 500 }}>Email</span>}
          initialValue={inviteInfo?.invitedEmail}
        >
          <Input
            prefix={<MailOutlined style={{ color: theme?.timestampColor || '#667781' }} />}
            disabled
            size="large"
            style={{ backgroundColor: theme?.secondaryColor || '#F0F2F5', border: `1px solid ${theme?.sidebarBorderColor || '#E9EDEF'}` }}
          />
        </Form.Item>
        
        {/* Name */}
        <Form.Item
          name="name"
          label={<span style={{ color: theme?.sidebarTextColor || '#111B21', fontWeight: 500 }}>Full Name</span>}
          rules={[
            { required: true, message: 'Name is required' },
            { min: 2, message: 'Name must be at least 2 characters' }
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: theme?.timestampColor || '#667781' }} />}
            placeholder="John Doe"
            size="large"
          />
        </Form.Item>
        
        {/* Password */}
        <Form.Item
          name="password"
          label={<span style={{ color: theme?.sidebarTextColor || '#111B21', fontWeight: 500 }}>Password</span>}
          rules={[
            { required: true, message: 'Password is required' },
            { min: 6, message: 'Password must be at least 6 characters' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: theme?.timestampColor || '#667781' }} />}
            placeholder="Min 6 characters"
            onChange={handlePasswordChange}
            size="large"
          />
        </Form.Item>
        
        {/* Password Strength Indicator */}
        {passwordStrength > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    backgroundColor: i <= passwordStrength ? theme?.accentColor || '#25D366' : theme?.sidebarBorderColor || '#E9EDEF',
                    transition: 'background-color 0.3s',
                  }}
                />
              ))}
            </div>
            <Text style={{ fontSize: 12, color: theme?.timestampColor || '#667781', marginTop: 4 }}>
              {passwordStrength < 2 && 'Weak'}
              {passwordStrength === 2 && 'Fair'}
              {passwordStrength === 3 && 'Good'}
              {passwordStrength === 4 && 'Strong'}
            </Text>
          </div>
        )}
        
        {/* Confirm Password */}
        <Form.Item
          name="confirmPassword"
          label={<span style={{ color: theme?.sidebarTextColor || '#111B21', fontWeight: 500 }}>Confirm Password</span>}
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('Passwords do not match!')
                );
              }
            })
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: theme?.timestampColor || '#667781' }} />}
            placeholder="Confirm password"
            size="large"
          />
        </Form.Item>
        
        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            size="large"
            style={{
              backgroundColor: theme?.primaryColor || '#008069',
              borderColor: theme?.primaryColor || '#008069',
              height: 44,
            }}
          >
            Accept Invite & Sign Up
          </Button>
        </Form.Item>
      </Form>
      
      <Divider style={{ margin: '20px 0' }} />
      
      {/* Footer Info */}
      <div style={{ textAlign: 'center' }}>
        <Text style={{ fontSize: 12, color: theme?.timestampColor || '#667781' }}>
          Already have account?{' '}
          <a
            onClick={() => navigate('/login')}
            style={{ color: theme?.primaryColor || '#008069', fontWeight: 500, cursor: 'pointer' }}
          >
            Log in
          </a>
        </Text>
      </div>
    </Card>
  );
}
