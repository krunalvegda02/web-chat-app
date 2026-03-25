import { useEffect, useState, useCallback } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { _get } from '../../helper/apiClient';
import ChatMonitorLayout from '../../components/chat/ChatMonitorLayout';

export default function SuperAdminAdminChats() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserChats, setSelectedUserChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [monitoredUserId, setMonitoredUserId] = useState(null);

  useEffect(() => {
    const loadAllUsers = async () => {
      setLoading(true);
      try {
        const response = await _get('/users/all');
        const users = response?.data?.data?.users || response?.data?.users || [];
        setAllUsers(users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          avatar: u.avatar
        })));
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadAllUsers();
  }, [user]);

  const handleUserSelect = useCallback(async (userId) => {
    setChatsLoading(true);
    try {
      const response = await _get(`/chat/user/${userId}/rooms`);
      const rooms = response?.data?.data?.rooms || response?.data?.rooms || [];
      const returnedUser = response?.data?.data?.user || response?.data?.user;
      setMonitoredUserId(returnedUser?._id?.toString() || userId.toString());
      setSelectedUserChats(rooms.map(room => {
        const otherParticipant = room.otherParticipants?.[0];
        return {
          id: room._id,
          roomId: room._id,
          participantId: otherParticipant?._id,
          participantName: otherParticipant?.name || 'Unknown',
          participantEmail: otherParticipant?.email,
          lastMessage: room.lastMessagePreview,
          lastMessageTime: room.lastMessageTime,
          messageCount: 0
        };
      }));
    } catch (error) {
      console.error('Failed to fetch user chats:', error);
      setSelectedUserChats([]);
    } finally {
      setChatsLoading(false);
    }
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <ChatMonitorLayout
      users={allUsers}
      usersLoading={loading}
      chats={selectedUserChats}
      chatsLoading={chatsLoading}
      onUserSelect={handleUserSelect}
      title="Monitor Chats"
      monitoredUserId={monitoredUserId}
    />
  );
}
