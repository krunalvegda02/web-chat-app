import { useEffect, useState, useMemo } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchAdminMemberChatsAPI } from '../../redux/slices/chatSlice';
import ChatMonitorLayout from '../../components/chat/ChatMonitorLayout';

export default function AdminUsersChat() {
  const { user } = useAuthGuard(['TENANT_ADMIN', 'PLATFORM_ADMIN']);
  const dispatch = useDispatch();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserChats, setSelectedUserChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [autoSelectedUserId, setAutoSelectedUserId] = useState(null);

  useEffect(() => {
    const loadMemberChats = async () => {
      setLoading(true);
      try {
        const result = await dispatch(fetchAdminMemberChatsAPI()).unwrap();
        console.log('Admin member chats result:', result);
        
        // Handle the correct data structure
        const usersData = result?.data?.users || result?.users || [];
        const processedUsers = usersData.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatar: u.avatar,
          role: u.role
        }));
        setUsers(processedUsers);
        
        // Auto-select user from URL params
        const urlParams = new URLSearchParams(location.search);
        const userIdFromUrl = urlParams.get('userId');
        if (userIdFromUrl && processedUsers.some(u => u.id === userIdFromUrl)) {
          setAutoSelectedUserId(userIdFromUrl);
          handleUserSelect(userIdFromUrl);
        }
      } catch (error) {
        console.error('Failed to fetch member chats:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadMemberChats();
  }, [dispatch, user, location.search]);

  const handleUserSelect = async (userId) => {
    console.log('🔍 User selected:', userId);
    setChatsLoading(true);
    try {
      // Use the API client helper instead of direct fetch
      const { _get } = await import('../../helper/apiClient');
      const result = await _get(`/chat/admin/member-chats/${userId}`);
      
      console.log('📡 User chats result:', result);
      console.log('📡 Full result.data:', result.data);
      console.log('📡 result.data.data:', result.data?.data);
      console.log('📡 result.data.data.rooms:', result.data?.data?.rooms);
      
      const rooms = result?.data?.data?.rooms || result?.data?.rooms || result?.rooms || [];
      console.log('🏠 Rooms found:', rooms.length);
      console.log('🏠 Actual rooms array:', rooms);
      
      const processedChats = rooms.map(room => {
        const otherParticipant = room.otherParticipants?.[0];
        console.log('🔄 Processing room:', room._id, 'Other participant:', otherParticipant);
        
        const chatItem = {
          id: room._id,
          roomId: room._id,
          participantId: otherParticipant?._id,
          participantName: otherParticipant?.name || 'Unknown',
          participantEmail: otherParticipant?.email,
          lastMessage: room.lastMessagePreview || room.lastMessage?.content || 'No messages',
          lastMessageTime: room.lastMessageTime,
          messageCount: 0,
          roomType: room.type,
          roomName: room.name
        };
        
        console.log('✅ Created chat item:', chatItem);
        return chatItem;
      });
      
      console.log('📋 Final processed chats:', processedChats);
      setSelectedUserChats(processedChats);
      
      // Force re-render by logging state after update
      setTimeout(() => {
        console.log('🔄 State after update - selectedUserChats length:', processedChats.length);
      }, 100);
      
    } catch (error) {
      console.error('❌ Failed to fetch user chats:', error);
      setSelectedUserChats([]);
    } finally {
      setChatsLoading(false);
    }
  };

  if (!user) return null;
  
  console.log('ChatMonitorLayout props:', {
    users: users.length,
    chats: selectedUserChats.length,
    usersLoading: loading,
    chatsLoading
  });

  return (
    <ChatMonitorLayout
      users={users}
      usersLoading={loading}
      chats={selectedUserChats}
      chatsLoading={chatsLoading}
      onUserSelect={handleUserSelect}
      title="Member Chats"
      initialSelectedUserId={autoSelectedUserId}
    />
  );
}
