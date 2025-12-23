
import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Card, Table, Button, Modal, Form, Input, Tooltip, Space, message, Tag, Avatar, Empty, Spin, Divider } from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  MailOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UnlockOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { getAdminUsers, generateInviteLink } from '../../redux/slices/tenantSlice.jsx';

export default function AdminUsersList() {
  const dispatch = useDispatch();
  const { user } = useAuthGuard(['ADMIN']);
  const { tenantUsers, loading } = useSelector((s) => s.tenant);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      dispatch(getAdminUsers());
    }
  }, [dispatch, user]);

  const users = tenantUsers?.users || [];

  const handleAddUser = async (values) => {
    try {
      await dispatch(generateInviteLink({ 
        tenantId: user.tenantId, 
        email: values.email,
        phone: values.phone 
      })).unwrap();
      message.success('✅ Invite sent successfully');
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      message.error(error || 'Failed to send invite');
    }
  };

  const getRoleTag = (role) => {
    const roleConfig = {
      'ADMIN': { color: '#10B981', text: 'Admin' },
      'MEMBER': { color: '#3B82F6', text: 'Member' },
      'GUEST': { color: '#9CA3AF', text: 'Guest' },
    };
    const config = roleConfig[role] || { color: '#6B7280', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: (
        <div className="flex items-center gap-2">
          <UserOutlined style={{ fontSize: '14px' }} />
          Name
        </div>
      ),
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#10B981' }}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{name}</span>
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <MailOutlined style={{ fontSize: '14px' }} />
          Email
        </div>
      ),
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <span className="text-gray-600 text-sm">{email}</span>
      ),
      width: 220,
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <UnlockOutlined style={{ fontSize: '14px' }} />
          Role
        </div>
      ),
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role),
      width: 120,
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <ClockCircleOutlined style={{ fontSize: '14px' }} />
          Joined
        </div>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className="text-gray-600 text-sm">
          {new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      ),
      width: 130,
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <CheckCircleOutlined style={{ fontSize: '14px' }} />
          Status
        </div>
      ),
      key: 'status',
      render: () => (
        <Tag color="#10B981" icon={<CheckCircleOutlined />}>
          Active
        </Tag>
      ),
      width: 100,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TeamOutlined style={{ fontSize: '24px', color: '#10B981' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Workspace Members
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage your team members and permissions
              </p>
            </div>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            className="bg-green-500 hover:bg-green-600 border-0 h-10"
            size="large"
          >
            Add Member
          </Button>
        </div>
        <Divider className="my-4" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TeamOutlined style={{ fontSize: '24px', color: '#3B82F6' }} />
            </div>
          </div>
        </Card>
{/* 
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Admins</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {users.filter((u) => u.role === 'ADMIN').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserOutlined style={{ fontSize: '24px', color: '#10B981' }} />
            </div>
          </div>
        </Card> */}

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#10B981' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="flex-1 border-0 shadow-sm overflow-auto">
        <Spin spinning={loading} tip="Loading members...">
          {users.length === 0 ? (
            <Empty
              description="No members yet"
              style={{ marginTop: '50px' }}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={users.map((u, i) => ({ ...u, key: u._id || i }))}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} members`,
                defaultPageSize: 10,
              }}
              size="large"
              bordered={false}
            />
          )}
        </Spin>
      </Card>

      {/* Add Member Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <PlusOutlined style={{ fontSize: '18px', color: '#10B981' }} />
            <span>Add Team Member</span>
          </div>
        }
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        okText="Send Invite"
        cancelText="Cancel"
        okButtonProps={{
          className: 'bg-green-500 hover:bg-green-600 border-0',
        }}
        width={500}
      >
        <Divider />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddUser}
        >
          <Form.Item
            label={<span className="font-semibold text-gray-700">Email Address</span>}
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
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold text-gray-700">Phone Number</span>}
            name="phone"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[+]?[0-9]{10,15}$/, message: 'Invalid phone number (10-15 digits)' },
            ]}
          >
            <Input
              placeholder="+1234567890"
              prefix={<PhoneOutlined />}
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          <p className="text-gray-500 text-xs mt-4">
            💡 An invitation link will be sent to this email address.
            The user can join your workspace by clicking the link.
          </p>
        </Form>
      </Modal>
    </div>
  );
}







// // pages/AdminUsersList.jsx (Enhanced)

// import { useState } from 'react';
// import { Card, Table, Button, Modal, Form, Input, Tooltip, message, Divider, Tag, Space } from 'antd';
// import { UserOutlined, DeleteOutlined, PlusOutlined, MailOutlined, CopyOutlined } from '@ant-design/icons';
// import api from '../services/api';

// export default function AdminUsersList() {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [form] = Form.useForm();
//   const [inviteUrl, setInviteUrl] = useState('');
//   const [inviteEmail, setInviteEmail] = useState('');
  
//   const handleAddUser = async (values) => {
//     try {
//       const response = await api.post(`/tenant/${user.tenantId}/invite-user`, {
//         email: values.email
//       });
      
//       setInviteUrl(response.data.data.inviteUrl);
//       setInviteEmail(values.email);
//       message.success('Invite link generated!');
      
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to generate invite');
//     }
//   };
  
//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(inviteUrl);
//     message.success('Link copied to clipboard!');
//   };
  
//   const columns = [
//     { title: 'Name', dataIndex: 'name', key: 'name' },
//     { title: 'Email', dataIndex: 'email', key: 'email' },
//     {
//       title: 'Role',
//       dataIndex: 'role',
//       key: 'role',
//       render: (role) => (
//         <Tag color={role === 'ADMIN' ? 'blue' : 'green'}>
//           {role}
//         </Tag>
//       )
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => (
//         <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>
//           {status}
//         </Tag>
//       )
//     },
//     {
//       title: 'Joined',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date) => new Date(date).toLocaleDateString()
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: () => (
//         <Tooltip title="Delete">
//           <Button
//             type="text"
//             danger
//             icon={<DeleteOutlined />}
//             className="hover:!bg-red-50/70 rounded-full"
//           />
//         </Tooltip>
//       )
//     }
//   ];
  
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-pink-100 p-4 md:p-8">
//       <Card className="w-full !bg-white/20 !backdrop-blur-xl !border-white/40 !shadow-2xl rounded-2xl">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
//           <div className="flex items-center gap-3">
//             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg">
//               <UserOutlined className="text-white text-xl" />
//             </div>
//             <div>
//               <h2 className="text-2xl font-bold text-slate-900">Users</h2>
//               <p className="text-sm text-slate-600">Manage workspace members</p>
//             </div>
//           </div>
          
//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             className="!bg-gradient-to-r !from-sky-400 !via-indigo-400 !to-purple-500 !border-none !h-10 md:!w-auto"
//             onClick={() => setIsModalVisible(true)}
//           >
//             Invite User
//           </Button>
//         </div>
        
//         <Divider />
        
//         {/* Table */}
//         <Table
//           columns={columns}
//           dataSource={users}
//           loading={loading}
//           pagination={{ pageSize: 10, showSizeChanger: true }}
//           rowClassName={() =>
//             'bg-white/30 hover:bg-white/50 backdrop-blur-md border border-white/40 rounded-xl transition-all duration-150'
//           }
//           className="!bg-transparent"
//         />
//       </Card>
      
//       {/* Invite Modal */}
//       <Modal
//         title={null}
//         open={isModalVisible}
//         onCancel={() => {
//           setIsModalVisible(false);
//           setInviteUrl('');
//           form.resetFields();
//         }}
//         footer={null}
//         centered
//         bodyStyle={{ padding: 0, background: 'transparent' }}
//         className="!max-w-md"
//       >
//         <div className="bg-white/25 backdrop-blur-2xl border border-white/40 rounded-2xl p-6">
//           {!inviteUrl ? (
//             <>
//               <h3 className="text-lg font-bold text-slate-900 mb-1">
//                 Invite a New User
//               </h3>
//               <p className="text-sm text-slate-600 mb-4">
//                 Send an invitation to join this workspace
//               </p>
              
//               <Form
//                 form={form}
//                 layout="vertical"
//                 onFinish={handleAddUser}
//               >
//                 <Form.Item
//                   name="email"
//                   label={<span className="font-medium text-slate-900">Email</span>}
//                   rules={[
//                     { required: true, message: 'Please enter email' },
//                     { type: 'email', message: 'Invalid email' }
//                   ]}
//                 >
//                   <Input
//                     prefix={<MailOutlined className="text-slate-500" />}
//                     placeholder="user@example.com"
//                     className="!bg-white/40 !border-white/60 !text-slate-900 placeholder:text-slate-500"
//                   />
//                 </Form.Item>
                
//                 <Space className="flex justify-end w-full gap-2">
//                   <Button
//                     onClick={() => {
//                       setIsModalVisible(false);
//                       form.resetFields();
//                     }}
//                     className="!border-none !bg-white/40 hover:!bg-white/60 !text-slate-800"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     className="!bg-gradient-to-r !from-sky-400 !to-indigo-500 !border-none !shadow-md"
//                   >
//                     Generate Link
//                   </Button>
//                 </Space>
//               </Form>
//             </>
//           ) : (
//             <>
//               <h3 className="text-lg font-bold text-slate-900 mb-2">
//                 ✅ Invite Link Generated
//               </h3>
              
//               <p className="text-sm text-slate-600 mb-4">
//                 Share this link with <strong>{inviteEmail}</strong>
//               </p>
              
//               {/* Link Display */}
//               <div className="bg-white/40 border border-white/60 rounded-lg p-3 mb-4 break-all">
//                 <p className="text-xs font-mono text-slate-900">{inviteUrl}</p>
//               </div>
              
//               {/* Copy Button */}
//               <Button
//                 block
//                 icon={<CopyOutlined />}
//                 onClick={copyToClipboard}
//                 className="!bg-gradient-to-r !from-sky-400 !to-indigo-500 !text-white !border-none !h-10 mb-3"
//               >
//                 Copy Link
//               </Button>
              
//               {/* Info */}
//               <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3 text-xs text-slate-700">
//                 <p>⏰ This link expires in 7 days</p>
//                 <p>📧 Share it via email or message</p>
//               </div>
              
//               <Button
//                 block
//                 className="mt-4 !bg-white/40 hover:!bg-white/60 !text-slate-800 !border-none"
//                 onClick={() => {
//                   setIsModalVisible(false);
//                   setInviteUrl('');
//                   form.resetFields();
//                 }}
//               >
//                 Done
//               </Button>
//             </>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }


