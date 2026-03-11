import { useEffect, useState, useMemo } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch } from 'react-redux';
import { fetchAdminMemberChatsAPI } from '../../redux/slices/chatSlice';
import ChatMonitorLayout from '../../components/chat/ChatMonitorLayout';

export default function AdminUsersChat() {
  const { user } = useAuthGuard(['TENANT_ADMIN', 'PLATFORM_ADMIN']);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const loadMemberChats = async () => {
      setLoading(true);
      try {
        const result = await dispatch(fetchAdminMemberChatsAPI()).unwrap();
        if (result?.data?.memberChats) {
          setMembers(result.data.memberChats);
        }
      } catch (error) {
        console.error('Failed to fetch member chats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMemberChats();
  }, [dispatch]);

  const users = useMemo(() => 
    members.map(member => ({
      id: member.memberId,
      name: member.memberName,
      email: member.memberEmail,
      avatar: member.memberAvatar,
      role: 'USER'
    })),
    [members]
  );

  const chats = useMemo(() => 
    members.flatMap(member => 
      (member.recentChats || []).map(chat => ({
        roomId: chat.roomId,
        participantId: member.memberId,
        participantName: member.memberName,
        participantEmail: member.memberEmail,
        participantAvatar: member.memberAvatar,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        messageCount: chat.messageCount,
        roomType: chat.roomType,
        roomName: chat.roomName
      }))
    ),
    [members]
  );

  if (!user) return null;

  return (
    <ChatMonitorLayout
      users={users}
      usersLoading={loading}
      chats={chats}
      chatsLoading={loading}
      title="Member Chats"
    />
  );
}
