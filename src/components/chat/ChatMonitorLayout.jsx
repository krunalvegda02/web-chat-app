import { useState } from 'react';
import { Select, Card, Spin, Empty } from 'antd';
import { UserOutlined, MessageOutlined } from '@ant-design/icons';

const { Option } = Select;

export default function ChatMonitorLayout({ 
  users, 
  usersLoading,
  chats, 
  chatsLoading,
  messages, 
  messagesLoading,
  onUserSelect,
  onChatSelect,
  getUserLabel,
  getChatLabel,
  getMessageAlignment
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
    setSelectedChat(null);
    onUserSelect(userId, user);
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    onChatSelect(chat, selectedUser);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <UserOutlined className="text-xl text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-800 mb-1">{getUserLabel.selectTitle}</h3>
              <Select
                placeholder={getUserLabel.selectPlaceholder}
                style={{ width: '100%', maxWidth: 450 }}
                size="large"
                value={selectedUser?.id}
                onChange={handleUserSelect}
                loading={usersLoading}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {users.map((user) => (
                  <Option key={user.id} value={user.id}>
                    {getUserLabel.renderOption(user)}
                  </Option>
                ))}
              </Select>
            </div>
            {selectedUser && (
              <div className="text-right px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 mb-0.5">{getUserLabel.viewingLabel}</p>
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                {selectedUser.meta && <p className="text-xs text-blue-600 mt-0.5">{selectedUser.meta}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        {selectedUser ? (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Sidebar - Chat List */}
            <div className="col-span-4">
              <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                <div className="px-5 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <h2 className="text-lg font-bold">{selectedUser.name}'s Conversations</h2>
                  <p className="text-xs text-blue-100 mt-1">{chats.length} {getChatLabel.countLabel}</p>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50">
                  {chatsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Spin tip="Loading conversations..." />
                    </div>
                  ) : chats.length === 0 ? (
                    <Empty description="No conversations found" className="mt-8" />
                  ) : (
                    <div className="p-2">
                      {chats.map((chat) => (
                        <div
                          key={chat.id}
                          className={`p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedChat?.id === chat.id 
                              ? 'bg-blue-50 border-2 border-blue-400 shadow-md' 
                              : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm'
                          }`}
                          onClick={() => handleChatSelect(chat)}
                        >
                          {getChatLabel.renderChat(chat)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="col-span-8">
              <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                {/* Chat Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-1">
                      {selectedChat ? getChatLabel.getTitle(selectedChat, selectedUser) : 'Select a conversation'}
                    </h2>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full font-medium">
                        🔒 Read-only mode
                      </span>
                      {selectedChat?.messageCount && (
                        <span className="bg-white/20 px-2.5 py-1 rounded-full">{selectedChat.messageCount} messages</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-scroll p-6 bg-gradient-to-b from-gray-50 to-white" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Spin size="large" tip="Loading messages..." />
                    </div>
                  ) : !selectedChat ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <MessageOutlined className="text-6xl mb-4 opacity-30" />
                        <p className="text-lg">Select a chat to view messages</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <Empty description="No messages in this conversation" className="mt-20" />
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${getMessageAlignment(msg, selectedUser)}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                              getMessageAlignment(msg, selectedUser) === 'justify-start'
                                ? 'bg-white border border-gray-200 text-gray-800'
                                : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            }`}
                          >
                            <div className="text-xs font-semibold mb-1.5 opacity-80">{msg.senderName}</div>
                            <div className="text-sm leading-relaxed">{msg.content}</div>
                            <div className="text-xs opacity-60 mt-2">
                              {new Date(msg.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Card className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-white/50">
            <div className="text-center text-gray-400">
              <UserOutlined className="text-7xl mb-4 opacity-20" />
              <h3 className="text-2xl font-semibold mb-2 text-gray-600">{getUserLabel.emptyTitle}</h3>
              <p className="text-gray-500">{getUserLabel.emptyDescription}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
