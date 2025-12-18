import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchTenantTheme } from '../../redux/slices/themeSlice';
import { Card, Button, Typography, Spin, Result } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function UserJoinPage() {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('token');

  useEffect(() => {
    if (tenantSlug) {
      dispatch(fetchTenantTheme(tenantSlug));
    }
  }, [tenantSlug, dispatch]);

  const handleContinue = () => {
    if (inviteToken) {
      navigate(`/register?tenant=${tenantSlug}&token=${inviteToken}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 !bg-slate-900 !border-slate-700 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            ✓
          </div>

          <Title level={2} className="!text-slate-100 !mb-2">
            Welcome to ChatApp
          </Title>

          <Paragraph className="!text-slate-400">
            You've been invited to join a professional chat workspace. Click below to get started.
          </Paragraph>

          <Button
            type="primary"
            block
            size="large"
            onClick={handleContinue}
            className="!h-10 !font-medium !rounded-lg mt-6"
          >
            Continue
          </Button>

          <Paragraph className="!text-slate-400 mt-4 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:text-blue-400">
              Sign in
            </a>
          </Paragraph>
        </div>
      </Card>
    </div>
  );
}
