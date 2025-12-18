import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Card, Table, Button, Modal, Form, Input, Tooltip, Space, message } from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  MailOutlined,
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
      await dispatch(generateInviteLink({ tenantId: user.tenantId, email: values.email })).unwrap();
      message.success('Invite sent successfully');
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      message.error(error || 'Failed to send invite');
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
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          className="hover:!bg-red-50/70 rounded-full"
        />
      </Tooltip>
    ),
  },
];

<Table
  columns={columns}
  dataSource={users}
  loading={loading}
  pagination={{ pageSize: 10 }}
  className="!bg-transparent"
  rowClassName={() =>
    'bg-white/30 hover:bg-white/50 backdrop-blur-md border border-white/40 rounded-xl transition-all duration-150'
  }
/>

return (
  <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-pink-100 flex items-start md:items-center justify-center p-4 md:p-8">
    <Card
      className="w-full max-w-5xl border-0 !bg-transparent shadow-xl rounded-2xl overflow-hidden"
      bodyStyle={{ padding: 0 }}
    >
      <div className="bg-white/20 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-400 flex items-center justify-center shadow-lg">
              <UserOutlined className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Users
              </h2>
              <p className="text-sm text-slate-600">
                Manage workspace users & invitations
              </p>
            </div>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="!bg-gradient-to-r !from-sky-400 !via-indigo-400 !to-purple-500 !border-none !shadow-md hover:!shadow-lg hover:!scale-[1.02] transition-all duration-200"
            onClick={() => setIsModalVisible(true)}
          >
            Invite User
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{ pageSize: 10 }}
         className="!bg-transparent !rounded-2xl overflow-hidden  !text-slate-900 glass-table"
        />
      </div>
    </Card>

    {/* Modal below... */}
    <Modal
  title={null}
  open={isModalVisible}
  onCancel={() => setIsModalVisible(false)}
  footer={null}
  centered
  className="!max-w-md"
  bodyStyle={{ padding: 0, background: 'transparent' }}
>
  <div className="bg-white/25 backdrop-blur-2xl border border-white/40 rounded-2xl p-5 md:p-6 shadow-2xl">
    <h3 className="text-lg font-semibold text-slate-900 mb-1">
      Invite a new user
    </h3>
    <p className="text-xs text-slate-600 mb-4">
      Send an invitation to join this workspace.
    </p>

    <Form form={form} layout="vertical" onFinish={handleAddUser}>
      <Form.Item
        name="email"
        label={<span className="text-slate-800">Email</span>}
        rules={[
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Invalid email' },
        ]}
      >
        <Input
          prefix={<MailOutlined className="text-slate-500" />}
          placeholder="user@example.com"
          className="!bg-white/40 !border-white/60 !text-slate-900 placeholder:text-slate-500"
        />
      </Form.Item>

      <Space className="flex justify-end w-full">
        <Button
          onClick={() => setIsModalVisible(false)}
          className="!border-none !bg-white/40 hover:!bg-white/60 !text-slate-800"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          className="!bg-gradient-to-r !from-sky-400 !via-indigo-400 !to-purple-500 !border-none !shadow-md hover:!shadow-lg hover:!scale-[1.02] transition-all duration-200"
        >
          Send Invite
        </Button>
      </Space>
    </Form>
  </div>
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


