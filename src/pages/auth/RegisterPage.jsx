import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { register, clearError } from '../../redux/slices/authSlice.jsx';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((s) => s.auth);
  const [form] = Form.useForm();

  const tenantSlug = searchParams.get('tenant');
  const inviteToken = searchParams.get('token');

  const handleRegister = async (values) => {
    const result = await dispatch(
      register({
        ...values,
        tenantSlug,
        inviteToken,
      })
    );
    if (result.payload) {
      navigate('/user/chat');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 !bg-slate-900 !border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            C
          </div>
          <Title level={2} className="!text-slate-100 !mb-1">
            Create Account
          </Title>
          <Text className="!text-slate-400">Join the chat workspace</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => dispatch(clearError())}
            className="mb-4"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegister}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label={<span className="text-slate-300">Full Name</span>}
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input
              prefix={<UserOutlined className="text-slate-500" />}
              placeholder="John Doe"
              size="large"
              className="!bg-slate-800 !border-slate-700 !text-slate-100"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className="text-slate-300">Email</span>}
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-slate-500" />}
              placeholder="you@example.com"
              size="large"
              className="!bg-slate-800 !border-slate-700 !text-slate-100"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-slate-300">Password</span>}
            rules={[
              { required: true, message: 'Please enter a password' },
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Form>

        <div className="mt-6 text-center">
          <Text className="!text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">
              Sign in
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}

