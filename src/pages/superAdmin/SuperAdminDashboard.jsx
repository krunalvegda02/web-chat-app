import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useTheme } from '../../hooks/useTheme';
import {
  Card,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  Button,
  Space,
  Avatar,
} from 'antd';
import {
  MessageOutlined,
  UsergroupDeleteOutlined,
  DatabaseOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

export default function SuperAdminDashboard() {
  const { theme } = useTheme();
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();
  const { rooms } = useSelector((s) => s.chat);

  if (!user) return null;

  const roomsArray = Array.isArray(rooms)
    ? rooms
    : rooms?.data?.rooms || rooms?.rooms || [];

  const stats = {
    totalChats: roomsArray.length || 0,
    totalMessages: 0,
    activeUsers: roomsArray.reduce(
      (sum, room) => sum + (room.participants?.length || 0),
      0
    ),
  };

  const statCards = [
    {
      title: 'Total Conversations',
      value: stats.totalChats,
      icon: MessageOutlined,
      color: theme.primaryColor || '#3B82F6',
      bgColor: theme.secondaryColor || '#E8F0FE',
    },
    {
      title: 'Active Participants',
      value: stats.activeUsers,
      icon: TeamOutlined,
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
    {
      title: 'Admin Workspaces',
      value: roomsArray.length,
      icon: DatabaseOutlined,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
  ];

  return (
    <div
      className="min-h-screen p-3 sm:p-4 md:p-6"
      style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
              style={{ color: theme.headerText || '#1F2937' }}
            >
              Dashboard
            </h1>
            <p
              className="text-sm sm:text-base"
              style={{ color: '#6B7280' }}
            >
              Welcome back, {user?.name || 'Admin'}
            </p>
          </div>
          <Avatar
            size={64}
            style={{
              backgroundColor: theme.primaryColor || '#3B82F6',
              fontSize: '24px',
              fontWeight: '600',
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
        </div>
      </div>

      {/* Stats Grid */}
      <Row gutter={[16, 16]} className="mb-6 sm:mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Col xs={24} sm={12} lg={8} key={idx}>
              <Card
                className="h-full border-0 transition-all duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: stat.bgColor,
                  borderLeft: `4px solid ${stat.color}`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className="text-xs sm:text-sm font-medium mb-2"
                      style={{ color: '#6B7280' }}
                    >
                      {stat.title}
                    </p>
                    <div
                      className="text-2xl sm:text-3xl md:text-4xl font-bold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon
                      style={{
                        fontSize: '24px',
                        color: stat.color,
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Recent Activity Section */}
      <Card
        className="border-0"
        style={{
          backgroundColor: theme.backgroundColor || '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div className="mb-4">
          <h2
            className="text-lg sm:text-xl font-bold flex items-center gap-2"
            style={{ color: theme.headerText || '#1F2937' }}
          >
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${theme.primaryColor || '#3B82F6'}20`,
              }}
            >
              <MessageOutlined
                style={{
                  color: theme.primaryColor || '#3B82F6',
                  fontSize: '18px',
                }}
              />
            </div>
            Recent Conversations
          </h2>
        </div>

        {roomsArray.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {roomsArray.slice(0, 5).map((room, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg transition-colors duration-200"
                style={{
                  backgroundColor: theme.backgroundColor || '#FFFFFF',
                  borderBottom: `1px solid ${theme.borderColor || '#E5E7EB'}`,
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar
                    size={40}
                    style={{
                      backgroundColor: theme.primaryColor || '#3B82F6',
                      flex: '0 0 auto',
                    }}
                  >
                    {room.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm sm:text-base truncate"
                      style={{ color: theme.headerText || '#1F2937' }}
                    >
                      {room.name || 'Unnamed Room'}
                    </p>
                    <p
                      className="text-xs sm:text-sm truncate"
                      style={{ color: '#9CA3AF' }}
                    >
                      {room.participants?.length || 0} participants
                    </p>
                  </div>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  style={{ color: theme.primaryColor || '#3B82F6' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <Empty
            description="No conversations yet"
            style={{ marginTop: '20px' }}
          />
        )}
      </Card>

      {/* Footer Info */}
      <div
        className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-lg flex items-start gap-3 sm:gap-4"
        style={{
          backgroundColor: `${theme.primaryColor || '#3B82F6'}10`,
          border: `1px solid ${theme.borderColor || '#E5E7EB'}`,
        }}
      >
        <CheckCircleOutlined
          style={{
            fontSize: '20px',
            color: theme.primaryColor || '#3B82F6',
            flex: '0 0 auto',
            marginTop: '2px',
          }}
        />
        <div>
          <p
            className="font-medium text-sm sm:text-base mb-1"
            style={{ color: theme.headerText || '#1F2937' }}
          >
            System Status
          </p>
          <p
            className="text-xs sm:text-sm"
            style={{ color: '#6B7280' }}
          >
            All systems operational. Latest update: 2 hours ago
          </p>
        </div>
      </div>
    </div>
  );
}
