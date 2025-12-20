import { useState, useMemo } from 'react';
import {
  Select,
  Spin,
  Empty,
  Avatar,
  Input,
  Button,
  Badge,
  Typography,
  Tooltip,
  Space,
} from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  SearchOutlined,
  PhoneOutlined,
  MoreOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';

const { Option } = Select;
const { Text } = Typography;

export default function ChatMonitorLayout({
  users = [],
  usersLoading = false,
  chats = [],
  chatsLoading = false,
  messages = [],
  messagesLoading = false,
  onUserSelect = () => {},
  onChatSelect = () => {},
  getUserLabel = {},
  getChatLabel = {},
  getMessageAlignment = () => 'justify-start',
}) {
  const { theme } = useTheme();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchChatTerm, setSearchChatTerm] = useState('');
  const [mobileView, setMobileView] = useState('select'); // 'select', 'rooms', 'chat'

  const primaryColor = theme?.primaryColor || '#10B981';
  const accentColor = '#059669';
  const lightGreen = '#D1FAE5';
  const veryLightGreen = '#F0FDF4';
  const borderColor = '#E5E7EB';
  const textColor = '#1F2937';

  const filteredChats = useMemo(() => {
    if (!selectedUser) return [];
    return chats.filter(
      (c) =>
        c.name?.toLowerCase().includes(searchChatTerm.toLowerCase()) ||
        c.participantName?.toLowerCase().includes(searchChatTerm.toLowerCase())
    );
  }, [chats, searchChatTerm, selectedUser]);

  const handleUserSelect = (userId) => {
    const user = users.find((u) => u.id === userId);
    setSelectedUser(user);
    setSelectedChat(null);
    setSearchChatTerm('');
    onUserSelect(userId, user);
    setMobileView('rooms');
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    onChatSelect(chat, selectedUser);
    setMobileView('chat');
  };

  // Mobile: User Selection Screen
  if (mobileView === 'select' && window.innerWidth < 768) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <div
          className="px-4 py-4 border-b"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TeamOutlined style={{ color: '#FFFFFF', fontSize: '20px' }} />
            <Text strong style={{ color: '#FFFFFF', fontSize: '18px' }}>
              Monitor Admin Chats
            </Text>
          </div>
          <Select
            placeholder="Select admin to monitor..."
            value={selectedUser?.id}
            onChange={handleUserSelect}
            loading={usersLoading}
            size="large"
            className="w-full"
            style={{ borderRadius: '8px' }}
          >
            {users.map((user) => (
              <Option key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  <Avatar size={24} style={{ backgroundColor: primaryColor }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <span>{user.name}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Empty
            image={<UserOutlined style={{ fontSize: '64px', color: `${primaryColor}40` }} />}
            description={
              <Text style={{ color: '#9CA3AF' }}>
                Select an admin to view their conversations
              </Text>
            }
          />
        </div>
      </div>
    );
  }

  // Mobile: Room List Screen
  if (mobileView === 'rooms' && selectedUser && window.innerWidth < 768) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <div
          className="px-4 py-3 border-b"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setMobileView('select')}
              style={{ color: '#FFFFFF' }}
            />
            <div className="flex-1">
              <Text strong style={{ color: '#FFFFFF', fontSize: '16px', display: 'block' }}>
                {selectedUser.name}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
              </Text>
            </div>
          </div>
          <Input
            placeholder="Search conversations..."
            prefix={<SearchOutlined style={{ color: primaryColor }} />}
            value={searchChatTerm}
            onChange={(e) => setSearchChatTerm(e.target.value)}
            size="large"
            style={{ borderRadius: '8px' }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {chatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spin />
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                className="p-4 rounded-xl bg-white cursor-pointer active:scale-98 transition-all"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-3">
                  <Avatar size={48} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                    {chat.participantName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Text strong style={{ fontSize: '14px', display: 'block' }}>
                      {chat.participantName}
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: '12px', display: 'block' }} className="truncate">
                      {chat.lastMessage || 'No messages'}
                    </Text>
                  </div>
                  {chat.messageCount > 0 && (
                    <Badge count={chat.messageCount} style={{ backgroundColor: primaryColor }} />
                  )}
                </div>
              </div>
            ))
          ) : (
            <Empty description="No conversations" />
          )}
        </div>
      </div>
    );
  }

  // Mobile: Chat Screen
  if (mobileView === 'chat' && selectedChat && selectedUser && window.innerWidth < 768) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: veryLightGreen }}>
        <div
          className="px-4 py-3 border-b flex items-center gap-3"
          style={{ backgroundColor: primaryColor }}
        >
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => setMobileView('rooms')}
            style={{ color: '#FFFFFF' }}
          />
          <Avatar size={36} style={{ backgroundColor: accentColor }}>
            {selectedChat.participantName?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div className="flex-1">
            <Text strong style={{ color: '#FFFFFF', fontSize: '14px', display: 'block' }}>
              {selectedChat.participantName}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>
              with {selectedUser.name}
            </Text>
          </div>
          <Space>
            <Button
              type="text"
              icon={<PhoneOutlined />}
              size="small"
              style={{ color: '#FFFFFF' }}
            />
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              style={{ color: '#FFFFFF' }}
            />
          </Space>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spin />
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, idx) => {
              const alignment = getMessageAlignment(msg, selectedUser);
              const isOwn = alignment === 'justify-end';

              return (
                <div key={msg.id || idx} className={`flex ${alignment} gap-2`}>
                  {!isOwn && (
                    <Avatar size={32} style={{ backgroundColor: primaryColor }}>
                      {msg.senderName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs px-4 py-2 ${isOwn ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'}`}
                    style={{
                      backgroundColor: isOwn ? primaryColor : '#FFFFFF',
                      color: isOwn ? '#FFFFFF' : textColor,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {!isOwn && (
                      <Text strong style={{ fontSize: '12px', color: primaryColor, display: 'block', marginBottom: '4px' }}>
                        {msg.senderName}
                      </Text>
                    )}
                    <Text style={{ fontSize: '14px', display: 'block', wordBreak: 'break-word' }}>
                      {msg.content}
                    </Text>
                    <Text style={{ fontSize: '11px', marginTop: '4px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isOwn && <CheckOutlined />}
                    </Text>
                  </div>
                  {isOwn && (
                    <Avatar size={32} style={{ backgroundColor: primaryColor }}>
                      {selectedUser.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  )}
                </div>
              );
            })
          ) : (
            <Empty description="No messages" />
          )}
        </div>

        <div
          className="p-3 text-center text-xs"
          style={{ backgroundColor: lightGreen, color: accentColor, borderTop: `1px solid ${borderColor}` }}
        >
          <ClockCircleOutlined className="mr-2" />
          Messages are encrypted and secure
        </div>
      </div>
    );
  }

  // Desktop: Split View
  return (
    <div className="h-[calc(100vh-64px)] flex bg-white">
      {/* Left: User Selector + Room List */}
      <div className="w-96 flex flex-col border-r" style={{ borderColor }}>
        <div
          className="px-4 py-4 border-b"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TeamOutlined style={{ color: '#FFFFFF', fontSize: '18px' }} />
            <Text strong style={{ color: '#FFFFFF', fontSize: '16px' }}>
              Monitor Admin Chats
            </Text>
          </div>
          <Select
            placeholder="Select admin..."
            value={selectedUser?.id}
            onChange={handleUserSelect}
            loading={usersLoading}
            size="large"
            className="w-full"
            style={{ borderRadius: '8px' }}
          >
            {users.map((user) => (
              <Option key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  <Avatar size={24} style={{ backgroundColor: primaryColor }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <span>{user.name}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        {selectedUser ? (
          <>
            <div className="px-4 py-3 border-b" style={{ borderColor }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Text strong style={{ fontSize: '14px', display: 'block' }}>
                    {selectedUser.name}
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: '12px' }}>
                    {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
                  </Text>
                </div>
                <Badge count={filteredChats.length} style={{ backgroundColor: primaryColor }} />
              </div>
              <Input
                placeholder="Search conversations..."
                prefix={<SearchOutlined style={{ color: primaryColor }} />}
                value={searchChatTerm}
                onChange={(e) => setSearchChatTerm(e.target.value)}
                size="large"
                style={{ borderRadius: '8px', backgroundColor: veryLightGreen }}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50">
              {chatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spin />
                </div>
              ) : filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat)}
                    className="p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      backgroundColor: selectedChat?.id === chat.id ? lightGreen : '#FFFFFF',
                      border: selectedChat?.id === chat.id ? `2px solid ${primaryColor}` : '1px solid #E5E7EB',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size={40} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                        {chat.participantName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Text strong style={{ fontSize: '14px', display: 'block' }}>
                          {chat.participantName}
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: '12px', display: 'block' }} className="truncate">
                          {chat.lastMessage || 'No messages'}
                        </Text>
                        {chat.messageCount > 0 && (
                          <Badge count={chat.messageCount} style={{ backgroundColor: primaryColor, marginTop: '4px' }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="No conversations" />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty
              image={<UserOutlined style={{ fontSize: '48px', color: `${primaryColor}40` }} />}
              description="Select an admin to view conversations"
            />
          </div>
        )}
      </div>

      {/* Right: Chat Window */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: veryLightGreen }}>
        {selectedChat && selectedUser ? (
          <>
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <Avatar size={40} style={{ backgroundColor: accentColor }}>
                  {selectedChat.participantName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div>
                  <Text strong style={{ color: '#FFFFFF', fontSize: '14px', display: 'block' }}>
                    {selectedChat.participantName}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                    {selectedUser.name}
                  </Text>
                </div>
              </div>
              <Space>
                <Tooltip title="Call">
                  <Button
                    type="text"
                    icon={<PhoneOutlined />}
                    size="small"
                    style={{ color: '#FFFFFF' }}
                  />
                </Tooltip>
                <Tooltip title="More">
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    size="small"
                    style={{ color: '#FFFFFF' }}
                  />
                </Tooltip>
              </Space>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spin />
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, idx) => {
                  const alignment = getMessageAlignment(msg, selectedUser);
                  const isOwn = alignment === 'justify-end';

                  return (
                    <div key={msg.id || idx} className={`flex ${alignment} gap-2`}>
                      {!isOwn && (
                        <Avatar size={32} style={{ backgroundColor: primaryColor }}>
                          {msg.senderName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      )}
                      <div
                        className={`max-w-md px-4 py-2 ${isOwn ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'}`}
                        style={{
                          backgroundColor: isOwn ? primaryColor : '#FFFFFF',
                          color: isOwn ? '#FFFFFF' : textColor,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        {!isOwn && (
                          <Text strong style={{ fontSize: '12px', color: primaryColor, display: 'block', marginBottom: '4px' }}>
                            {msg.senderName}
                          </Text>
                        )}
                        <Text style={{ fontSize: '14px', display: 'block', wordBreak: 'break-word' }}>
                          {msg.content}
                        </Text>
                        <Text style={{ fontSize: '11px', marginTop: '4px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && <CheckOutlined />}
                        </Text>
                      </div>
                      {isOwn && (
                        <Avatar size={32} style={{ backgroundColor: primaryColor }}>
                          {selectedUser.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      )}
                    </div>
                  );
                })
              ) : (
                <Empty description="No messages" />
              )}
            </div>

            <div
              className="p-3 text-center text-xs"
              style={{ backgroundColor: lightGreen, color: accentColor, borderTop: `1px solid ${borderColor}` }}
            >
              <ClockCircleOutlined className="mr-2" />
              Messages are encrypted and secure
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty
              image={<MessageOutlined style={{ fontSize: '64px', color: `${primaryColor}40` }} />}
              description="Select a conversation to view messages"
            />
          </div>
        )}
      </div>
    </div>
  );
}
