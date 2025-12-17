import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Card, Table, Button, Modal, Form, Input, Tooltip, Space } from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { getTenantUsers, generateInviteLink } from '../../redux/slices/tenantSlice.jsx';

export default function AdminUsersList() {
  const dispatch = useDispatch();
  const { user } = useAuthGuard(['ADMIN']);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user?.tenantId) {
      fetchUsers();
    }
  }, [user?.tenantId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await dispatch(getTenantUsers({ tenantId: user.tenantId }));
      if (result.payload) {
        const usersData = result.payload.data?.users || result.payload.data || result.payload.users || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await dispatch(generateInviteLink(user.tenantId));
      form.resetFields();
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Tooltip title="Delete">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="!bg-slate-900 !border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <UserOutlined className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Users</h2>
              <p className="text-sm text-slate-400">Manage workspace users</p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Invite User
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{ pageSize: 20 }}
          className="!bg-slate-950"
        />
      </Card>

      <Modal
        title="Invite User"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        className="!bg-slate-900"
      >
        <Form form={form} layout="vertical" onFinish={handleAddUser}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="user@example.com"
              className="!bg-slate-800 !border-slate-700"
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit">
              Send Invite
            </Button>
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

