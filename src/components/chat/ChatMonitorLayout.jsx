import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Select,
  Spin,
  Empty,
  Avatar,
  Badge,
  Typography,
  Button,
} from 'antd';
import {
  MessageOutlined,
  SearchOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';
import { _get } from '../../helper/apiClient';
import MessageBubble from './MessageBubble';

const { Text } = Typography;

export default function ChatMonitorLayout({
  users = [],
  usersLoading = false,
  chats = [],
  chatsLoading = false,
  onUserSelect = () => {},
  title = 'Monitor Chats',
}) {
  console.log("chats",chats)
  const { theme } = useTheme();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [chatOpened, setChatOpened] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const primaryColor = '#008069';
  const veryLightGreen = '#F0FDF4';
  const textColor = '#1F2937';

  console.log('📊 ChatMonitorLayout rendered:', { users: users.length, chats: chats.length, loading: chatsLoading });

  const formatDateLabel = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    msgDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    if (msgDate.getTime() === today.getTime()) return 'Today';
    if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const fetchMessages = useCallback(async (roomId, pageNum = 1) => {
    if (!roomId) return;
    
    setMessagesLoading(true);
    try {
      const response = await _get(`/chat/rooms/${roomId}/messages?page=${pageNum}&limit=50&readOnly=true`);
      const newMessages = response.data?.data?.messages || [];
      
      if (pageNum === 1) {
        setMessages(newMessages.reverse());
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
      } else {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      }
      
      setHasMore(response.data?.data?.pagination?.hasMore || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || messagesLoading || !hasMore) return;
    
    if (messagesContainerRef.current.scrollTop === 0) {
      fetchMessages(selectedChat?.roomId, page + 1);
    }
  }, [messagesLoading, hasMore, selectedChat, page, fetchMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleChatSelect = (chat) => {
    const user = users.find(u => u.id === selectedUserId) || users.find(u => u.id === chat.participantId);
    setSelectedUser(user || { _id: chat.participantId, name: chat.participantName });
    setSelectedChat(chat);
    setMessages([]);
    setPage(1);
    fetchMessages(chat.roomId, 1);
    setChatOpened(true);
  };

  const combinedList = chats;
  const filteredList = selectedUserId
    ? combinedList.filter(item => 
        item.participantId === selectedUserId
      )
    : combinedList;

  console.log('🔍 Debug:', {
    chatsLength: chats.length,
    filteredListLength: filteredList.length,
    messagesLength: messages.length
  });

  const allParticipants = new Map();
  users.forEach(user => {
    allParticipants.set(user.id, {
      value: user.id,
      label: user.name,
      email: user.email,
      type: user.role || 'ADMIN'
    });
  });
  
  chats.forEach(chat => {
    if (chat.participantId) {
      allParticipants.set(chat.participantId, {
        value: chat.participantId,
        label: chat.participantName,
        email: chat.participantEmail || '',
        type: 'USER'
      });
    }
  });

  const userOptions = Array.from(allParticipants.values());

  // Mobile view
  if (window.innerWidth < 768) {
    if (!chatOpened) {
      return (
        <>
          <style>{`body { overflow: hidden !important; }`}</style>
          <div className="fixed top-0 left-0 right-0 bottom-14 flex flex-col bg-[#F0F2F5] z-10">
            <div className="bg-[#008069] px-4 py-5 flex items-center gap-3">
              <h1 className="text-white text-xl font-medium flex-1">{title}</h1>
              <SearchOutlined className="text-white text-xl" />
            </div>

            <div className="bg-white px-3 py-2 border-b">
              <Select
                showSearch
                placeholder="Select user to view chats..."
                optionFilterProp="children"
                value={selectedUserId}
                onChange={(value) => {
                  setSelectedUserId(value);
                  const user = users.find(u => u.id === value);
                  if (user) onUserSelect(value, user);
                }}
                allowClear
                style={{ width: '100%' }}
                size="large"
                virtual
                listHeight={400}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                  (option?.email ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={userOptions}
                optionRender={(option) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{option.data.label}</span>
                    <span className="text-xs text-gray-500">{option.data.email}</span>
                  </div>
                )}
              />
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
              {chatsLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" />
                </div>
              ) : filteredList.length > 0 ? (
                filteredList.map((item, idx) => (
                  <div
                    key={`${item.roomId}-${idx}`}
                    onClick={() => handleChatSelect(item)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#E9EDEF] hover:bg-[#F5F6F6] cursor-pointer active:bg-[#E9EDEF] transition-colors"
                  >
                    <Avatar
                      size={50}
                      style={{ backgroundColor: primaryColor, flexShrink: 0 }}
                    >
                      {item.participantName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-[#111B21] text-[16px] truncate">
                          {item.participantName}
                        </p>
                        <span className="text-xs text-[#667781]">
                          {new Date(item.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#667781] truncate">
                          {item.lastMessage || 'No messages'}
                        </p>
                        {item.messageCount > 0 && (
                          <Badge
                            count={item.messageCount}
                            style={{ backgroundColor: '#25D366' }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="No chats found" className="mt-20" />
              )}
            </div>
          </div>
        </>
      );
    } else if (selectedChat) {
      return (
        <>
          <style>{`
            body { overflow: hidden !important; }
            nav[class*="bottom-0"] { display: none !important; }
          `}</style>
          <div className="fixed inset-0 flex flex-col bg-white z-[150]">
            <div className="bg-[#008069] px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => {
                  setChatOpened(false);
                  setSelectedChat(null);
                }}
                className="text-white"
              >
                ←
              </button>
              <Avatar size={36} style={{ backgroundColor: primaryColor }}>
                {selectedChat.participantName?.charAt(0)?.toUpperCase()}
              </Avatar>
              <div className="flex-1">
                <Text strong style={{ color: '#FFFFFF', fontSize: '14px', display: 'block' }}>
                  {selectedChat.participantName}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>
                  {selectedUser?.name}
                </Text>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: veryLightGreen }} ref={messagesContainerRef}>
              {messagesLoading && page === 1 ? (
                <div className="flex items-center justify-center h-full">
                  <Spin />
                </div>
              ) : messages.length > 0 ? (
                <>
                  {hasMore && (
                    <div className="text-center py-2">
                      <Button size="small" loading={messagesLoading} onClick={() => fetchMessages(selectedChat.roomId, page + 1)}>
                        Load older messages
                      </Button>
                    </div>
                  )}
                  {messages.map((msg, idx) => {
                    const showDate = shouldShowDateSeparator(msg, messages[idx - 1]);
                    const sender = msg.sender || msg.senderId;
                    const currentUserId = sender?.role === 'ADMIN' || sender?.role === 'TENANT_ADMIN' ? sender?._id : null;
                    
                    return (
                      <div key={msg._id}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <div className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#E9EDEF', color: '#667781' }}>
                              {formatDateLabel(msg.createdAt)}
                            </div>
                          </div>
                        )}
                        <MessageBubble message={msg} currentUser={{ _id: currentUserId }} showAvatar={true} />
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <Empty description="No messages" />
              )}
            </div>

            <div className="p-3 text-center text-xs" style={{ backgroundColor: '#F0F2F5', color: '#667781', borderTop: '1px solid #E5E7EB' }}>
              Read-only view • No live updates
            </div>
          </div>
        </>
      );
    }
    return null;
  }

  // Desktop view
  return (
    <>
      <style>{`body { overflow: hidden !important; }`}</style>
      <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex bg-white">
        <div className="w-96 flex flex-col border-r border-[#E9EDEF] bg-white">
          <div className="bg-[#008069] px-4 py-4 flex items-center justify-between">
            <h1 className="text-white text-xl font-medium">{title}</h1>
            <SearchOutlined className="text-white text-xl cursor-pointer" />
          </div>

          <div className="px-3 py-2 bg-white border-b border-[#E9EDEF]">
            <Select
              showSearch
              placeholder="Select user to view chats..."
              optionFilterProp="children"
              value={selectedUserId}
              onChange={(value) => {
                setSelectedUserId(value);
                const user = users.find(u => u.id === value);
                if (user) onUserSelect(value, user);
              }}
              allowClear
              style={{ width: '100%' }}
              size="large"
              virtual
              listHeight={400}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                (option?.email ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={userOptions}
              optionRender={(option) => (
                <div className="flex flex-col">
                  <span className="font-medium">{option.data.label}</span>
                  <span className="text-xs text-gray-500">{option.data.email}</span>
                </div>
              )}
            />
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {chatsLoading ? (
              <div className="flex justify-center items-center h-full">
                <Spin size="large" />
              </div>
            ) : filteredList.length > 0 ? (
              filteredList.map((item, idx) => (
                <div
                  key={`${item.roomId}-${idx}`}
                  onClick={() => handleChatSelect(item)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#E9EDEF] hover:bg-[#F5F6F6] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selectedChat?.roomId === item.roomId ? '#F0F2F5' : 'transparent'
                  }}
                >
                  <Avatar
                    size={50}
                    style={{ backgroundColor: primaryColor, flexShrink: 0 }}
                  >
                    {item.participantName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[#111B21] text-[16px] truncate">
                        {item.participantName}
                      </p>
                      <span className="text-xs text-[#667781]">
                        {new Date(item.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#667781] truncate">
                        {item.lastMessage || 'No messages'}
                      </p>
                      {item.messageCount > 0 && (
                        <Badge
                          count={item.messageCount}
                          style={{ backgroundColor: '#25D366' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty description="No chats found" className="mt-20" />
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="bg-[#008069] px-4 py-3 flex items-center gap-3">
                <Avatar size={40} style={{ backgroundColor: primaryColor }}>
                  {selectedChat.participantName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div>
                  <Text strong style={{ color: '#FFFFFF', fontSize: '14px', display: 'block' }}>
                    {selectedChat.participantName}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                    {selectedUser?.name}
                  </Text>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: veryLightGreen }} ref={messagesContainerRef}>
                {messagesLoading && page === 1 ? (
                  <div className="flex items-center justify-center h-full">
                    <Spin />
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {hasMore && (
                      <div className="text-center py-2">
                        <Button size="small" loading={messagesLoading} onClick={() => fetchMessages(selectedChat.roomId, page + 1)}>
                          Load older messages
                        </Button>
                      </div>
                    )}
                    {messages.map((msg, idx) => {
                      const showDate = shouldShowDateSeparator(msg, messages[idx - 1]);
                      const sender = msg.sender || msg.senderId;
                      const currentUserId = sender?.role === 'ADMIN' || sender?.role === 'TENANT_ADMIN' ? sender?._id : null;
                      
                      return (
                        <div key={msg._id}>
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <div className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#E9EDEF', color: '#667781' }}>
                                {formatDateLabel(msg.createdAt)}
                              </div>
                            </div>
                          )}
                          <MessageBubble message={msg} currentUser={{ _id: currentUserId }} showAvatar={true} />
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <Empty description="No messages" />
                )}
              </div>

              <div className="p-3 text-center text-xs" style={{ backgroundColor: '#F0F2F5', color: '#667781', borderTop: '1px solid #E5E7EB' }}>
                Read-only view • No live updates
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#F0F2F5]">
              <Empty
                image={<MessageOutlined style={{ fontSize: '64px', color: '#8696A0' }} />}
                description={
                  <span className="text-[#667781] text-sm">
                    Select a chat to view conversation
                  </span>
                }
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}