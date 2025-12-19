import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch, useSelector } from 'react-redux';
import { getAllTenants } from '../../redux/slices/tenantSlice';
import { setActiveRoom, fetchMessages } from '../../redux/slices/chatSlice';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get } from '../../helper/apiClient';
import ChatMonitorLayout from '../../components/chat/ChatMonitorLayout';

const fetchAdminChats = createAsyncThunkHandler(
  'chat/fetchAdminChats',
  _get,
  (adminId) => `/chat/admin/chats/${adminId}`
);

export default function SuperAdminAdminChats() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();
  const { tenants } = useSelector((state) => state.tenant);
  const { activeRoomId, messagesByRoom } = useSelector((s) => s.chat);
  const [chatParticipants, setChatParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllTenants());
  }, [dispatch]);

  const handleUserSelect = async (adminId) => {
    dispatch(setActiveRoom(null));
    setLoading(true);
    try {
      const result = await dispatch(fetchAdminChats(adminId));
      if (result.payload?.data?.chats) {
        setChatParticipants(result.payload.data.chats);
      }
    } catch (error) {
      setChatParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = async (chat) => {
    dispatch(setActiveRoom(chat.id));
    setMessagesLoading(true);
    await dispatch(fetchMessages({ roomId: chat.id, page: 1, limit: 50 }));
    setMessagesLoading(false);
  };

  if (!user) return null;

  const users = tenants?.map(t => ({
    id: t.admin?._id,
    name: t.admin?.name,
    email: t.admin?.email
  })).filter(u => u.id) || [];

  const chats = chatParticipants.map(c => ({
    id: c.roomId,
    participantName: c.participantName,
    lastMessage: c.lastMessage,
    lastMessageTime: c.lastMessageTime,
    messageCount: c.messageCount || 0
  }));

  const messages = activeRoomId ? (messagesByRoom[activeRoomId] || []).map(m => ({
    id: m._id,
    senderId: m.sender?._id,
    senderName: m.sender?.name,
    content: m.content,
    timestamp: m.createdAt
  })) : [];

  return (
    <ChatMonitorLayout
      role="SUPER_ADMIN"
      users={users}
      usersLoading={false}
      chats={chats}
      chatsLoading={loading}
      messages={messages}
      messagesLoading={messagesLoading}
      onUserSelect={handleUserSelect}
      onChatSelect={handleChatSelect}
      getUserLabel={{
        selectTitle: 'Select Admin to View Chats',
        selectPlaceholder: 'Choose an admin to view their chats',
        viewingLabel: 'Viewing chats for:',
        emptyTitle: 'No Admin Selected',
        emptyDescription: 'Please select an admin from the dropdown above to view their chats',
        renderOption: (user) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            <span className="text-gray-500">({user.email})</span>
          </div>
        )
      }}
      getChatLabel={{
        countLabel: 'conversations',
        renderChat: (chat) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium shadow-md">
              {chat.participantName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm truncate">{chat.participantName}</div>
                {chat.messageCount > 0 && (
                  <div className="ml-2 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-sm">
                    {chat.messageCount}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {chat.lastMessage || 'No messages yet'}
              </div>
            </div>
          </div>
        ),
        getTitle: (chat, user) => `${user.name} & ${chat.participantName}`
      }}
      getMessageAlignment={(msg, user) => 
        msg.senderId === user.id ? 'justify-end' : 'justify-start'
      }
    />
  );
}