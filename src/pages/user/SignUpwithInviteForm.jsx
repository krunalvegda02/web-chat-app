import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { registerWithInvite } from '../../redux/slices/authSlice';

export default function SignupWithInviteForm({ token, tenantId, inviteInfo }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
        confirmPassword: values.confirmPassword
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
    <Card className="w-full max-w-md !bg-white/20 !backdrop-blur-xl !border-white/40 !shadow-2xl rounded-2xl">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <UserOutlined className="text-white text-xl" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Join {inviteInfo?.tenantName}
        </h1>
        <p className="text-slate-600 text-sm">
          Complete your registration to get started
        </p>
      </div>
      
      <Divider className="!my-6" />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        {/* Email - Read Only */}
        <Form.Item
          name="email"
          label={<span className="font-medium text-slate-900">Email</span>}
          initialValue={inviteInfo?.invitedEmail}
        >
          <Input
            prefix={<MailOutlined className="text-slate-400" />}
            disabled
            className="!bg-white/30 !border-white/60 !text-slate-900"
          />
        </Form.Item>
        
        {/* Name */}
        <Form.Item
          name="name"
          label={<span className="font-medium text-slate-900">Full Name</span>}
          rules={[
            { required: true, message: 'Name is required' },
            { min: 2, message: 'Name must be at least 2 characters' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-slate-400" />}
            placeholder="John Doe"
            className="!bg-white/30 !border-white/60 !text-slate-900 placeholder:text-slate-500"
          />
        </Form.Item>
        
        {/* Password */}
        <Form.Item
          name="password"
          label={<span className="font-medium text-slate-900">Password</span>}
          rules={[
            { required: true, message: 'Password is required' },
            { min: 6, message: 'Password must be at least 6 characters' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Min 6 characters"
            onChange={handlePasswordChange}
            className="!bg-white/30 !border-white/60 !text-slate-900 placeholder:text-slate-500"
          />
        </Form.Item>
        
        {/* Password Strength Indicator */}
        {passwordStrength > 0 && (
          <div className="mb-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= passwordStrength
                      ? 'bg-green-400'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {passwordStrength < 2 && 'Weak'}
              {passwordStrength === 2 && 'Fair'}
              {passwordStrength === 3 && 'Good'}
              {passwordStrength === 4 && 'Strong'}
            </p>
          </div>
        )}
        
        {/* Confirm Password */}
        <Form.Item
          name="confirmPassword"
          label={<span className="font-medium text-slate-900">Confirm Password</span>}
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
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Confirm password"
            className="!bg-white/30 !border-white/60 !text-slate-900 placeholder:text-slate-500"
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
            className="!h-11 !text-base !bg-gradient-to-r !from-sky-400 !via-indigo-400 !to-purple-500 !border-none !shadow-lg hover:!shadow-xl hover:!scale-[1.02] transition-all duration-200"
          >
            Accept Invite & Sign Up
          </Button>
        </Form.Item>
      </Form>
      
      <Divider className="!my-6" />
      
      {/* Footer Info */}
      <div className="text-center text-xs text-slate-600 space-y-2">
        <p>✅ Invite link expires in 7 days</p>
        <p>Already have account? 
          <button
            onClick={() => navigate('/login')}
            className="text-indigo-500 hover:text-indigo-700 font-semibold ml-1"
          >
            Log in
          </button>
        </p>
      </div>
    </Card>
  );
}
