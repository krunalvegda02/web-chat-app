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
        style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}
      >
        <Card className="w-full max-w-md border-0 shadow-lg" style={{ border: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}>
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
                  backgroundColor: theme.primaryColor || '#008069',
                  borderColor: theme.primaryColor || '#008069',
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
        style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}
      >
        <Spin size="large" tip="Verifying invitation..." />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}
      >
        <Card className="w-full max-w-md border-0 shadow-lg" style={{ border: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}>
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
                  backgroundColor: theme.primaryColor || '#008069',
                  borderColor: theme.primaryColor || '#008069',
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
      className="fixed inset-0 flex items-center justify-center overflow-auto"
      style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}
    >
      <div className="w-full max-w-5xl px-4 py-8">
        <Row gutter={[32, 32]} align="middle">
          {/* Left Side - Welcome Info */}
          <Col xs={24} lg={12}>
            <div className="space-y-6">
              <div>
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4"
                  style={{
                    backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF',
                    border: `2px solid ${theme.primaryColor || '#008069'}`,
                  }}
                >
                  <HomeOutlined
                    style={{
                      fontSize: '28px',
                      color: theme.primaryColor || '#008069',
                    }}
                  />
                </div>
                <Title
                  level={2}
                  style={{ color: theme.sidebarTextColor || '#111B21', margin: 0 }}
                >
                  You're Invited!
                </Title>
                <Paragraph
                  style={{ color: theme.timestampColor || '#667781', fontSize: '15px', marginTop: '8px' }}
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
                        color: theme.accentColor || '#25D366',
                        fontSize: '18px',
                        marginTop: '2px',
                        flex: '0 0 auto',
                      }}
                    />
                    <Text
                      style={{
                        color: theme.timestampColor || '#667781',
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
                  className="border-0 shadow-sm"
                  style={{
                    backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF',
                    border: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}`,
                    borderRadius: '8px',
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div className="flex items-center gap-2">
                      <MailOutlined
                        style={{
                          color: theme.primaryColor || '#008069',
                          fontSize: '16px',
                        }}
                      />
                      <Text
                        style={{ color: theme.timestampColor || '#667781', fontSize: '14px' }}
                        className="break-all"
                      >
                        {inviteInfo.inviterEmail}
                      </Text>
                    </div>
                    <Text
                      style={{
                        color: theme.sidebarTextColor || '#111B21',
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

          {/* Right Side - Form */}
          <Col xs={24} lg={12}>
            <SignupWithInviteForm
              token={token}
              tenantId={tenantId}
              inviteInfo={inviteInfo}
              onSuccess={() => navigate('/chat')}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
