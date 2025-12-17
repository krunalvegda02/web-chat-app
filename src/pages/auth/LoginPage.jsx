import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Checkbox, Typography, Alert } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { login, clearError } from '../../redux/slices/authSlice.jsx';

const { Title, Text } = Typography;

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    const result = await dispatch(login(values));

    if (result.type === 'auth/login/fulfilled') {
      const { user } = result.payload.data;

      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'SUPER_ADMIN') navigate('/super-admin');
      else navigate('/user/chat');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-cyan-100">


      {/* Main Card */}
      <Card
        className="w-full max-w-md bg-white/40 shadow-2xl border border-white/30 rounded-2xl"
        bodyStyle={{ padding: '32px 28px', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            C
          </div>

          <Title level={2} className="!mt-4 !mb-1 !text-gray-900">
            Welcome Back
          </Title>

          <Text className="!text-gray-600">
            Sign in to continue your chat experience
          </Text>
        </div>

        {/* Error Message */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            className="mb-4"
            onClose={() => dispatch(clearError())}
          />
        )}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
        >
          {/* Email */}
          <Form.Item
            name="email"
            label={<span className="text-gray-700 font-medium">Email</span>}
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Invalid email format' },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined className="text-gray-500" />}
              placeholder="you@example.com"
              className="!bg-white/60 !backdrop-blur-xl !border-gray-300 !rounded-xl !text-gray-900"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            name="password"
            label={<span className="text-gray-700 font-medium">Password</span>}
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined className="text-gray-500" />}
              placeholder="••••••••"
              className="!bg-white/60 !backdrop-blur-xl !border-gray-300 !rounded-xl !text-gray-900"
            />
          </Form.Item>

          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="text-gray-700">Remember me</Checkbox>
            </Form.Item>

            <Link to="/forgot-password" className="text-indigo-600 hover:underline text-sm">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!rounded-xl !h-11 !bg-gradient-to-r !from-indigo-500 !to-cyan-500 !shadow-lg hover:!opacity-90 !border-none !text-white"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Text className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Sign up
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
  