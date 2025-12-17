
// ============================================================================
// ADMIN CHAT MONITOR - pages/admin/AdminChatMonitor.jsx
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Card, Input, Table, Statistic, Row, Col } from 'antd';
import { SearchOutlined, MessageOutlined } from '@ant-design/icons';
import { fetchRooms } from '../../redux/slices/chatSlice';

export default function AdminChatMonitor() {
  const { user } = useAuthGuard(['ADMIN']);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await fetchRooms(user?.tenantId);
      setChats(response.rooms || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalRooms: chats.length,
    totalParticipants: chats.reduce((sum, c) => sum + (c.participantCount || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Card className="!bg-slate-900 !border-slate-700">
            <Statistic
              title="Active Rooms"
              value={stats.totalRooms}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="!bg-slate-900 !border-slate-700">
            <Statistic
              title="Total Participants"
              value={stats.totalParticipants}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="!bg-slate-900 !border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <MessageOutlined className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Active Conversations</h2>
        </div>

        <Input
          prefix={<SearchOutlined />}
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 !bg-slate-800 !border-slate-700 !text-slate-100"
        />

        <Table
          columns={[
            { title: 'Room', dataIndex: 'name', key: 'name' },
            { title: 'Participants', dataIndex: 'participantCount', key: 'participantCount' },
            { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (text) => new Date(text).toLocaleDateString() },
          ]}
          dataSource={filteredChats}
          loading={loading}
          className="!bg-slate-950"
        />
      </Card>
    </div>
  );
}

