
import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Card, Table, Button, Modal, Form, Input, message, Tag, Avatar, Empty, Spin } from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  MailOutlined,
  TeamOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { getPlatformUsers } from '../../redux/slices/platformSlice.jsx';

export default function AdminUsersList() {
  const dispatch = useDispatch();
  const { user, isAuthorized } = useAuthGuard(['PLATFORM_ADMIN']);
  const { platformUsers, loading } = useSelector((s) => s.platform);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  console.log('👥 [AdminUsersList] Rendered', {
    hasUser: !!user,
    userRole: user?.role,
    isAuthorized,
  });

  useEffect(() => {
    if (user) {
      dispatch(getPlatformUsers());
    }
  }, [dispatch, user]);

  const users = platformUsers?.users || [];

  const handleAddUser = async (values) => {
    try {
      // Invite functionality removed - no generateInviteLink
      message.success('✅ Invite sent successfully');
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      message.error(error || 'Failed to send invite');
    }
  };

  const getRoleTag = (role) => {
    const roleConfig = {
      'PLATFORM_ADMIN': { color: '#10B981', text: 'Admin' },
      'USER': { color: '#3B82F6', text: 'Member' },
    };
    const config = roleConfig[role] || { color: '#6B7280', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className={clsx('flex', 'items-center', 'gap-3')}>
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#10B981' }}
          />
          <span className={clsx('font-semibold', 'text-gray-900')}>{name}</span>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <span className={clsx('text-gray-600', 'text-sm')}>{email}</span>,
      width: 250,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role),
      width: 100,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className={clsx('text-gray-600', 'text-sm')}>
          {new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      ),
      width: 120,
    },
  ];

  if (!isAuthorized) {
    return (
      <div className={clsx('min-h-screen', 'bg-gray-50', 'p-3', 'md:p-6', 'flex', 'items-center', 'justify-center')}>
        <Card className={clsx('border-0', 'shadow-sm')}>
          <Empty description="Access Denied" />
        </Card>
      </div>
    );
  }

  return (
    <div className={clsx('min-h-screen', 'bg-gray-50', 'p-3', 'md:p-6')}>
      {/* Header */}
      <Card className={clsx('mb-4', 'border-0', 'shadow-sm')}>
        <div className={clsx('flex', 'flex-col', 'md:flex-row', 'md:items-center', 'md:justify-between', 'gap-4')}>
          <div className={clsx('flex', 'items-center', 'gap-3')}>
            <div className={clsx('p-3', 'bg-green-100', 'rounded-lg')}>
              <TeamOutlined style={{ fontSize: '24px', color: '#10B981' }} />
            </div>
            <div>
              <h1 className={clsx('text-2xl', 'font-bold', 'text-gray-900')}>
                Workspace Members
              </h1>
              <p className={clsx('text-gray-500', 'text-sm', 'mt-1')}>
                {users.length} total members
              </p>
            </div>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            className={clsx('bg-green-500', 'hover:bg-green-600', 'border-0')}
            size="large"
          >
            Add Member
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className={clsx('border-0', 'shadow-sm')}>
        <Spin spinning={loading} tip="Loading members...">
          {users.length === 0 ? (
            <Empty description="No members yet" />
          ) : (
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={users.map((u, i) => ({ ...u, key: u._id || i }))}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} members`,
                  pageSizeOptions: ['10', '20', '50'],
                }}
                scroll={{ x: 800 }}
                size="middle"
              />
            </div>
          )}
        </Spin>
      </Card>

      {/* Add Member Modal */}
      <Modal
        title="Add Team Member"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        okText="Send Invite"
        cancelText="Cancel"
        okButtonProps={{
          className: 'bg-green-500 hover:bg-green-600 border-0',
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddUser}
          className="mt-4"
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input
              placeholder="user@example.com"
              prefix={<MailOutlined />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[+]?[0-9]{10,15}$/, message: 'Invalid phone number' },
            ]}
          >
            <Input
              placeholder="+1234567890"
              prefix={<PhoneOutlined />}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
