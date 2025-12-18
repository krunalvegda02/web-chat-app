import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../hooks/useTheme';
import RoomList from './RoomList';
import ChatWindow from './ChatWindow';
import { Modal, List, Avatar, message, Spin } from 'antd';
import { createDirectRoom, createAdminChat, setActiveRoom, fetchRooms, fetchAvailableUsers } from '../../redux/slices/chatSlice';

/**
 * Standard Chat Layout Component
 * Works for all roles: USER, ADMIN, SUPER_ADMIN
 * Automatically fetches rooms based on user role
 */
export default function StandardChatLayout() {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [showModal, setShowModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Initialize socket connection
  useSocket();

  // Handle plus icon click
  const handlePlusClick = async () => {
    setShowModal(true);
    setLoadingUsers(true);
    try {
      const result = await dispatch(fetchAvailableUsers()).unwrap();
      setAvailableUsers(result?.data?.users || result?.users || []);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle create room
  const handleCreateRoom = async (selectedUser) => {
    try {
      setCreatingRoom(true);
      const currentUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(user?.role);
      const selectedUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(selectedUser.role);
      const isAdminChat = currentUserIsAdmin && selectedUserIsAdmin;
      
      const result = isAdminChat
        ? await dispatch(createAdminChat({ adminId: selectedUser._id })).unwrap()
        : await dispatch(createDirectRoom({ userId: selectedUser._id })).unwrap();
      
      const roomId = result?.data?.room?._id || result?.room?._id || result?._id;
      
      if (roomId) {
        dispatch(setActiveRoom(roomId));
        dispatch(fetchRooms());
        message.success('Chat opened successfully');
      }
      setShowModal(false);
    } catch (error) {
      message.error('Failed to create chat');
    } finally {
      setCreatingRoom(false);
    }
  };

  return (
    <>
      <div 
        className="h-[calc(100vh-64px)] flex gap-4 p-4"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        {/* Room List Sidebar */}
        <div 
          className="w-72"
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: `0 1px 3px ${theme.borderColor}`,
          }}
        >
          <RoomList onCreateRoom={handlePlusClick} />
        </div>

        {/* Chat Window */}
        <div 
          className="flex-1"
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: `0 1px 3px ${theme.borderColor}`,
          }}
        >
          <ChatWindow />
        </div>
      </div>

      {/* Universal Modal for all roles */}
      <Modal
        title="Start a Conversation"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={500}
      >
        {(loadingUsers || creatingRoom) ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={availableUsers}
            renderItem={(item) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50 px-4 py-3 rounded"
                onClick={() => !creatingRoom && handleCreateRoom(item)}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.avatar}>{item.name?.[0]}</Avatar>}
                  title={item.name}
                  description={item.email}
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
}
