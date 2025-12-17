import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminChatRooms, createOrGetAdminRoom, setActiveRoom } from '../../redux/slices/chatSlice';
import { getAllTenants } from '../../redux/slices/tenantSlice';
import RoomList from '../../components/chat/RoomList';
import ChatWindow from '../../components/chat/ChatWindow';
import { Modal, List, Avatar, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function SuperAdminChat() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();
  const { tenants } = useSelector((state) => state.tenant);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllTenants());
    dispatch(fetchAdminChatRooms());
  }, [dispatch]);

  const handleCreateChat = async (adminId) => {
    setLoading(true);
    try {
      const result = await dispatch(createOrGetAdminRoom({ adminId })).unwrap();
      let roomId = null;
      if (result?.data?.room?._id) roomId = result.data.room._id;
      else if (result?.room?._id) roomId = result.room._id;
      else if (result?._id) roomId = result._id;

      if (!roomId) {
        message.error('Failed to get room ID');
        return;
      } else if (roomId) {
        dispatch(setActiveRoom(roomId));
        await dispatch(fetchAdminChatRooms());
        message.success('Chat opened successfully');
      }
      setShowAdminModal(false);
    } catch (error) {
      message.error(error || 'Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip="Loading..." />
      </div>
    );
  }

  const tenantsArray = Array.isArray(tenants)
    ? tenants
    : tenants?.data?.tenants || tenants?.data || [];
  const adminsList = tenantsArray
    .map(t => t.admin)
    .filter(admin => admin && admin._id);

  return (
    <div className="h-screen">
      <div className="grid grid-cols-12 gap-4 h-[calc(100%-80px)]">
        <div className="col-span-4">
          <RoomList
            fetchRoomsAction={fetchAdminChatRooms}
            onCreateRoom={() => setShowAdminModal(true)}
          />
        </div>
        <div className="col-span-8">
          <ChatWindow />
        </div>
      </div>

      <Modal
        title="Start Chat with Admin"
        open={showAdminModal}
        onCancel={() => setShowAdminModal(false)}
        footer={null}
        width={500}
      >
        <List
          dataSource={adminsList}
          loading={loading}
          renderItem={(admin) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50 px-4 py-3 rounded"
              onClick={() => {
                if (!loading) {
                  handleCreateChat(admin._id);
                }
              }}
            >
              <List.Item.Meta
                avatar={<Avatar src={admin.avatar}>{admin.name?.[0]}</Avatar>}
                title={admin.name}
                description={admin.email}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}