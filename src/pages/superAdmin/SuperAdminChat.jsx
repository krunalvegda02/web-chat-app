import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminRooms, createAdminRoom } from '../../redux/slices/chatSlice';
import { getAllTenants } from '../../redux/slices/tenantSlice';
import RoomList from '../../components/chat/RoomList';
import ChatWindow from '../../components/chat/ChatWindow';
import { useSocket } from '../../hooks/useSocket';
import { Card, Button, Modal, List, Avatar } from 'antd';
import { MessageOutlined, PlusOutlined } from '@ant-design/icons';

export default function SuperAdminChat() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();
  const { tenants } = useSelector((state) => state.tenant);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    const initializeAdminChats = async () => {
      try {
        // First get all tenants
        const tenantsResult = await dispatch(getAllTenants());
        console.log('Tenants result:', tenantsResult);
        
        // Auto-create rooms for all admins
        if (tenantsResult.payload?.data) {
          console.log('Creating rooms for admins:', tenantsResult.payload.data);
          const createRoomPromises = tenantsResult.payload.data.map(async (tenant) => {
            console.log('Creating room for admin:', tenant.admin);
            const result = await dispatch(createAdminRoom({ adminId: tenant.admin._id }));
            console.log('Room creation result:', result);
            return result;
          });
          await Promise.all(createRoomPromises);
        }
        
        // Then fetch all admin rooms
        const roomsResult = await dispatch(fetchAdminRooms());
        console.log('Admin rooms result:', roomsResult);
      } catch (error) {
        console.error('Error initializing admin chats:', error);
      }
    };

    initializeAdminChats();
  }, [dispatch]);

  const handleCreateAdminRoom = async (adminId) => {
    await dispatch(createAdminRoom({ adminId }));
    dispatch(fetchAdminRooms());
    setShowAdminModal(false);
  };

  if (!user) return null;

  return (
    <div className="h-screen ">
      <div className="grid grid-cols-12 gap-4 h-[calc(100%-80px)]">
        <div className="col-span-4">
          <RoomList 
            fetchRoomsAction={fetchAdminRooms}
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
      >
        <List
          dataSource={tenants}
          renderItem={(tenant) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleCreateAdminRoom(tenant.admin._id)}
                >
                  Chat
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar>{tenant.admin.name[0]}</Avatar>}
                title={tenant.admin.name}
                description={tenant.admin.email}
              />
            </List.Item>
          )}
        />
      </Modal>
      {/* </Card> */}
    </div>
  );
}