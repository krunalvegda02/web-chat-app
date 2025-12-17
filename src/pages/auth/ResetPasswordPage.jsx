
// ============================================================================
// RESET PASSWORD PAGE - pages/auth/ResetPasswordPage.jsx
// ============================================================================

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="w-full max-w-md !bg-slate-900 !border-slate-700">
          <Alert
            message="Invalid reset link"
            type="error"
            showIcon
            className="mb-4"
          />
          <Button type="primary" block onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  // const handleReset = async (values) => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     await axiosClient.post('/auth/reset-password', {
  //       token,
  //       password: values.password,
  //     });
  //     setSuccess(true);
  //     setTimeout(() => navigate('/login'), 2000);
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Failed to reset password');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="w-full max-w-md !bg-slate-900 !border-slate-700">
          <Alert
            message="Password reset successful!"
            type="success"
            showIcon
            className="mb-4"
          />
          <Text className="!text-slate-400">
            Redirecting to login page...
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <Card className="w-full max-w-md !bg-slate-900 !border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <Title level={2} className="!text-slate-100 !mb-1">
            Reset Password
          </Title>
          <Text className="!text-slate-400">Enter your new password</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}

        <Form layout="vertical" onFinish={handleReset}>
          <Form.Item
            name="password"
            label={<span className="text-slate-300">New Password</span>}
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-500" />}
              placeholder="••••••••"
              size="large"
              className="!bg-slate-800 !border-slate-700 !text-slate-100"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span className="text-slate-300">Confirm Password</span>}
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-500" />}
              placeholder="••••••••"
              size="large"
              className="!bg-slate-800 !border-slate-700 !text-slate-100"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!h-10 !font-medium !rounded-lg"
          >
            Reset Password
          </Button>
        </Form>
      </Card>
    </div>
  );
}

