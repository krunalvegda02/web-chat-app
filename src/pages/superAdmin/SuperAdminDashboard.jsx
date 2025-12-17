import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { getAllChats } from '../../redux/slices/chatSlice.jsx';
import { Card, Row, Col, Statistic, Table, Empty } from 'antd';
import { MessageOutlined, UsergroupDeleteOutlined, DatabaseOutlined } from '@ant-design/icons';

export default function SuperAdminDashboard() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();
  const { allChats, loadingChats } = useSelector((s) => s.chat);

  useEffect(() => {
    dispatch(getAllChats());
  }, [dispatch]);

  if (!user) return null;

  console.log(allChats)

  const stats = {
    totalChats: allChats?.data?.chats?.length || 0,
    totalMessages: allChats?.data?.chats?.reduce((sum, chat) => sum + (chat.messageCount || 0), 0) || 0,
    activeUsers: allChats?.data?.chats?.reduce((sum, chat) => sum + (chat.participantCount || 0), 0) || 0,
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

      {/* Chat Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h3>
        <Table
          dataSource={allChats?.data?.chats?.slice(0, 10) || []}
          loading={loadingChats}
          pagination={false}
          columns={[
            { title: 'Room', dataIndex: 'name', key: 'name' },
            { title: 'Participants', dataIndex: 'participantCount', key: 'participantCount' },
            { title: 'Messages', dataIndex: 'messageCount', key: 'messageCount' },
            { title: 'Last Message', dataIndex: 'lastMessageTime', key: 'lastMessageTime' },
          ]}
          className="bg-gray-50"
          locale={{ emptyText: <Empty description="No conversations" /> }}
        />
      </Card>
    </div>
  );
}

