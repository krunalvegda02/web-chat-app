import { useEffect } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch, useSelector } from 'react-redux';
import { MessageOutlined } from '@ant-design/icons';
import { fetchAdminMemberChats, fetchSpecificMemberChats, fetchMemberChatHistory, clearMessages } from '../../redux/slices/adminChatSlice';
import ChatMonitorLayout from '../../components/chat/ChatMonitorLayout';

export default function AdminUsersChat() {
  const { user } = useAuthGuard(['ADMIN', 'TENANT_ADMIN']);
  const dispatch = useDispatch();
  const { members, memberChats, messages, loading, chatsLoading, messagesLoading } = useSelector((state) => state.adminChat);

  useEffect(() => {
    dispatch(fetchAdminMemberChats());
  }, [dispatch]);

  const handleUserSelect = (memberId) => {
    dispatch(clearMessages());
    dispatch(fetchSpecificMemberChats({ memberId }));
  };

  const handleChatSelect = (chat, selectedUser) => {
    dispatch(fetchMemberChatHistory({ memberId: selectedUser.id, roomId: chat.id }));
  };

  if (!user) return null;

  const users = members.map(m => ({
    id: m.memberId,
    name: m.memberName,
    email: m.memberEmail,
    meta: `${m.totalChats} conversations`
  }));

  const chats = memberChats.map(c => ({
    id: c.roomId,
    roomType: c.roomType,
    roomName: c.roomName,
    otherParticipants: c.otherParticipants,
    lastMessage: c.lastMessage,
    messageCount: c.messageCount
  }));

  const formattedMessages = messages.map(m => ({
    id: m.messageId,
    senderId: m.sender.id,
    senderName: m.sender.name,
    content: m.content,
    timestamp: m.createdAt
  }));

  return (
    <ChatMonitorLayout
      role="ADMIN"
      users={users}
      usersLoading={loading}
      chats={chats}
      chatsLoading={chatsLoading}
      messages={formattedMessages}
      messagesLoading={messagesLoading}
      onUserSelect={handleUserSelect}
      onChatSelect={handleChatSelect}
      getUserLabel={{
        selectTitle: 'Select Member to View Chats',
        selectPlaceholder: 'Choose a member to view their chats',
        viewingLabel: 'Viewing chats for:',
        emptyTitle: 'No Member Selected',
        emptyDescription: 'Please select a member from the dropdown above to view their chats',
        renderOption: (user) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            <span className="text-gray-500">({user.email})</span>
            <span className="text-xs text-blue-600">• {user.meta}</span>
          </div>
        )
      }}
      getChatLabel={{
        countLabel: 'conversations',
        renderChat: (chat) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium shadow-md">
              {chat.roomType === 'GROUP' ? <MessageOutlined /> : chat.otherParticipants[0]?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm truncate">
                  {chat.roomType === 'GROUP' ? chat.roomName : chat.otherParticipants[0]?.name}
                </div>
                <div className="ml-2 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-sm">
                  {chat.messageCount}
                </div>
              </div>
              <div className="text-xs text-gray-500 truncate">{chat.lastMessage}</div>
              {chat.roomType && (
                <div className="text-xs text-gray-400 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {chat.roomType}
                  </span>
                </div>
              )}
            </div>
          </div>
        ),
        getTitle: (chat, user) => 
          chat.roomType === 'GROUP' 
            ? chat.roomName 
            : `${user.name} & ${chat.otherParticipants[0]?.name}`
      }}
      getMessageAlignment={(msg, user) => 
        msg.senderId === user.id ? 'justify-start' : 'justify-end'
      }
    />
  );
}
