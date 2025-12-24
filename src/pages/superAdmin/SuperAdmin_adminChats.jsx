import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch } from 'react-redux';
import { fetchAllPlatformChats } from '../../redux/slices/chatSlice';
import ChatMonitorLayout from '../../components/chat/ChatMonitorLayout';

export default function SuperAdminAdminChats() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [allRooms, setAllRooms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllChats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dispatch(fetchAllPlatformChats()).unwrap();
        console.log('📥 API Response:', result);
        if (result?.data?.rooms) {
          console.log('📦 Rooms found:', result.data.rooms.length);
          setAllRooms(result.data.rooms);
        } else {
          console.log('⚠️ No rooms in response');
          setAllRooms([]);
        }
      } catch (error) {
        console.error('Failed to fetch all chats:', error);
        setError(error.message);
        setAllRooms([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      loadAllChats();
    }
  }, [dispatch, user]);

  if (!user) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Extract unique users from all rooms
  const usersMap = new Map();
  allRooms.forEach(room => {
    room.participants?.forEach(p => {
      if (p.userId && p.userId._id) {
        usersMap.set(p.userId._id, {
          id: p.userId._id,
          name: p.userId.name,
          email: p.userId.email,
          role: p.userId.role
        });
      }
    });
  });

  const users = Array.from(usersMap.values());

  // Format chats from rooms
  const chats = allRooms.map(room => {
    const otherParticipants = room.participants?.filter(p => p.userId) || [];
    const firstParticipant = otherParticipants[0]?.userId;
    
    return {
      id: room._id,
      roomId: room._id,
      participantId: firstParticipant?._id,
      participantName: room.type === 'GROUP' ? room.name : firstParticipant?.name,
      participantEmail: firstParticipant?.email,
      lastMessage: room.lastMessagePreview,
      lastMessageTime: room.lastMessageTime,
      messageCount: room.participantCount
    };
  });

  console.log('📊 Formatted chats:', chats.length, chats);

  return (
    <ChatMonitorLayout
      users={users}
      usersLoading={loading}
      chats={chats}
      chatsLoading={loading}
      onUserSelect={() => {}} // No filtering needed, showing all
      title="Monitor All Chats"
    />
  );
}
