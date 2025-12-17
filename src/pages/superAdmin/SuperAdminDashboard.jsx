import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Card, Row, Col, Statistic, Empty } from 'antd';
import { MessageOutlined, UsergroupDeleteOutlined, DatabaseOutlined } from '@ant-design/icons';

export default function SuperAdminDashboard() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();
  const { rooms } = useSelector((s) => s.chat);

  // No need to fetch - rooms are already loaded

  if (!user) return null;

  const roomsArray = Array.isArray(rooms) ? rooms : rooms?.data?.rooms || rooms?.rooms || [];

  const stats = {
    totalChats: roomsArray.length || 0,
    totalMessages: 0,
    activeUsers: roomsArray.reduce((sum, room) => sum + (room.participants?.length || 0), 0),
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Stats Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="bg-white border-gray-200 shadow-sm">
            <Statistic
              title="Total Conversations"
              value={stats.totalChats}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="bg-white border-gray-200 shadow-sm">
            <Statistic
              title="Total Messages"
              value={stats.totalMessages}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="bg-white border-gray-200 shadow-sm">
            <Statistic
              title="Active Users"
              value={stats.activeUsers}
              prefix={<UsergroupDeleteOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Conversations */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h3>
        {roomsArray.length === 0 ? (
          <Empty description="No conversations" />
        ) : (
          <div className="space-y-2">
            {roomsArray.slice(0, 10).map((room) => (
              <div key={room._id} className="p-3 border rounded hover:bg-gray-50">
                <div className="font-medium">{room.name || 'Unnamed Room'}</div>
                <div className="text-sm text-gray-500">
                  {room.participants?.length || 0} participants
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

