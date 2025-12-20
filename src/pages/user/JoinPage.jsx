import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import {
  Button,
  Spin,
  Result,
  Card,
  Typography,
  Space,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons';
import SignupWithInviteForm from './SignUpwithInviteForm';
import { fetchInviteInfo } from '../../redux/slices/authSlice';

const { Title, Text, Paragraph } = Typography;

export default function JoinPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const { inviteInfo, inviteLoading, inviteError } = useSelector(
    (s) => s.auth
  );

  const token = searchParams.get('token');
  const tenantId = searchParams.get('tenantId');

  useEffect(() => {
    if (token && tenantId) {
      dispatch(fetchInviteInfo({ token, tenantId }));
    }
  }, [dispatch, token, tenantId]);

  if (!token || !tenantId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
      >
        <Card className="w-full max-w-md border-0 shadow-lg">
          <Result
            status="warning"
            title="Invalid Invitation"
            subTitle="This invitation link is not valid or has expired."
            extra={
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: theme.primaryColor || '#3B82F6',
                  borderColor: theme.primaryColor || '#3B82F6',
                }}
              >
                Back to Login
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (inviteLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col gap-4"
        style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
      >
        <Spin size="large" tip="Verifying invitation..." />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
      >
        <Card className="w-full max-w-md border-0 shadow-lg">
          <Result
            status="error"
            title="Invitation Error"
            subTitle={inviteError || 'Failed to verify invitation'}
            extra={
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: theme.primaryColor || '#3B82F6',
                  borderColor: theme.primaryColor || '#3B82F6',
                }}
              >
                Back to Login
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 md:px-8"
      style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
    >
      <div className="max-w-4xl mx-auto">
        <Row gutter={[24, 24]} align="middle">
          {/* Left Side - Welcome Info */}
          <Col xs={24} lg={12}>
            <div className="space-y-6">
              <div>
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4"
                  style={{
                    backgroundColor: `${theme.primaryColor || '#3B82F6'}20`,
                  }}
                >
                  <HomeOutlined
                    style={{
                      fontSize: '28px',
                      color: theme.primaryColor || '#3B82F6',
                    }}
                  />
                </div>
                <Title
                  level={2}
                  style={{ color: theme.headerText || '#1F2937' }}
                >
                  You're Invited!
                </Title>
                <Paragraph
                  style={{ color: '#6B7280', fontSize: '16px' }}
                >
                  Join {inviteInfo?.tenantName || 'our workspace'} and start
                  collaborating with your team.
                </Paragraph>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                {[
                  'Instant communication with your team',
                  'Secure message delivery',
                  'Professional workspace environment',
                ].map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3"
                  >
                    <CheckCircleOutlined
                      style={{
                        color: '#10B981',
                        fontSize: '18px',
                        marginTop: '2px',
                        flex: '0 0 auto',
                      }}
                    />
                    <Text
                      style={{
                        color: '#6B7280',
                        fontSize: '14px',
                      }}
                    >
                      {benefit}
                    </Text>
                  </div>
                ))}
              </div>

              {/* Tenant Info */}
              {inviteInfo && (
                <Card
                  className="border-0"
                  style={{
                    backgroundColor: `${theme.primaryColor || '#3B82F6'}08`,
                    border: `1px solid ${theme.borderColor || '#E5E7EB'}`,
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div className="flex items-center gap-2">
                      <MailOutlined
                        style={{
                          color: theme.primaryColor || '#3B82F6',
                        }}
                      />
                      <Text
                        style={{ color: '#6B7280' }}
                      >
                        {inviteInfo.inviterEmail}
                      </Text>
                    </div>
                    <Text
                      style={{
                        color: theme.headerText || '#1F2937',
                        fontSize: '14px',
                      }}
                    >
                      has invited you to join their workspace
                    </Text>
                  </Space>
                </Card>
              )}
            </div>
          </Col>

          <Divider type="vertical" style={{ height: 'auto', display: 'none' }} className="hidden lg:block" />

          {/* Right Side - Form */}
          <Col xs={24} lg={12}>
            <SignupWithInviteForm
              inviteInfo={inviteInfo}
              onSuccess={() => navigate('/chat')}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
