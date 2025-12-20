import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import {
  MessageOutlined,
  UserOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  fetchAdminMemberChats,
  fetchSpecificMemberChats,
  fetchMemberChatHistory,
  clearMessages,
} from '../../redux/slices/adminChatSlice';
import { Input, Avatar, Badge, Empty, Spin, Select } from 'antd';
import ChatWindow from '../../components/chat/ChatWindow';
import { setActiveRoom } from '../../redux/slices/chatSlice';

export default function AdminUsersChat() {
  const { theme } = useTheme();
  const { user } = useAuthGuard(['ADMIN', 'TENANT_ADMIN']);
  const dispatch = useDispatch();
  const { members, memberChats, messages, loading, chatsLoading, messagesLoading } = useSelector(
    (state) => state.adminChat
  );
  const { activeRoomId } = useSelector((s) => s.chat);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [chatOpened, setChatOpened] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminMemberChats());
  }, [dispatch]);

  const handleRoomClick = async (chat) => {
    const member = members.find(m => m.memberId === chat.memberId);
    setSelectedMember(member);
    dispatch(setActiveRoom(chat.roomId));
    await dispatch(fetchMemberChatHistory({ memberId: chat.memberId, roomId: chat.roomId }));
    setChatOpened(true);
  };

  if (!user) return null;

  // Combine members with their top 10 chats
  const combinedList = members.flatMap(member => 
    (member.recentChats || []).slice(0, 10).map(chat => ({
      ...chat,
      memberId: member.memberId,
      memberName: member.memberName,
      memberEmail: member.memberEmail,
      memberAvatar: member.memberAvatar,
    }))
  );

  const filteredList = selectedMemberId
    ? combinedList.filter(item => 
        item.memberId === selectedMemberId || 
        item.otherParticipants?.some(p => p.userId === selectedMemberId)
      )
    : combinedList;

  // Extract unique participants from all chats (both members and other participants)
  const allParticipants = new Map();
  
  // Add members
  members.forEach(member => {
    allParticipants.set(member.memberId, {
      value: member.memberId,
      label: member.memberName,
      email: member.memberEmail,
      type: 'USER'
    });
  });
  
  // Add other participants from chats
  combinedList.forEach(chat => {
    if (chat.otherParticipants && Array.isArray(chat.otherParticipants)) {
      chat.otherParticipants.forEach(participant => {
        if (participant && participant.userId) {
          allParticipants.set(participant.userId, {
            value: participant.userId,
            label: participant.name,
            email: participant.email || '',
            type: participant.role || 'USER'
          });
        }
      });
    }
  });

  const memberOptions = Array.from(allParticipants.values());

  const primaryColor = '#008069';

  // Mobile view
  if (window.innerWidth < 768) {
    if (!chatOpened) {
      return (
        <>
          <style>{`body { overflow: hidden !important; }`}</style>
          <div className="fixed top-0 left-0 right-0 bottom-14 flex flex-col bg-[#F0F2F5] z-10">
            {/* WhatsApp Header */}
            <div className="bg-[#008069] px-4 py-5 flex items-center gap-3">
              <h1 className="text-white text-xl font-medium flex-1">Member Chats</h1>
              <SearchOutlined className="text-white text-xl" />
            </div>

            {/* Search Bar */}
            <div className="bg-white px-3 py-2 border-b">
              <Select
                showSearch
                placeholder="Select member to view chats..."
                optionFilterProp="children"
                value={selectedMemberId}
                onChange={(value) => setSelectedMemberId(value)}
                allowClear
                style={{ width: '100%' }}
                size="large"
                virtual
                listHeight={400}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                  (option?.email ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={memberOptions}
                optionRender={(option) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{option.data.label}</span>
                    <span className="text-xs text-gray-500">{option.data.email}</span>
                  </div>
                )}
              />
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto bg-white">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" />
                </div>
              ) : filteredList.length > 0 ? (
                filteredList.map((item, idx) => (
                  <div
                    key={`${item.roomId}-${idx}`}
                    onClick={() => handleRoomClick(item)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#E9EDEF] hover:bg-[#F5F6F6] cursor-pointer active:bg-[#E9EDEF] transition-colors"
                  >
                    <Avatar
                      size={50}
                      src={item.memberAvatar}
                      style={{ backgroundColor: primaryColor, flexShrink: 0 }}
                    >
                      {item.memberName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-[#111B21] text-[16px] truncate">
                          {item.memberName}
                        </p>
                        <span className="text-xs text-[#667781]">
                          {new Date(item.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#667781] truncate">
                          {item.roomType === 'GROUP' ? `📁 ${item.roomName}` : item.lastMessage || 'No messages'}
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
    } else if (activeRoomId) {
      return (
        <>
          <style>{`
            body { overflow: hidden !important; }
            nav[class*="bottom-0"] { display: none !important; }
          `}</style>
          <div className="fixed inset-0 flex flex-col bg-white z-[150]">
            <ChatWindow
              showMobileHeader={true}
              readOnly={true}
              onBack={() => {
                setChatOpened(false);
                dispatch(setActiveRoom(''));
              }}
            />
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
        {/* Left: Combined List */}
        <div className="w-96 flex flex-col border-r border-[#E9EDEF] bg-white">
          {/* WhatsApp Header */}
          <div className="bg-[#008069] px-4 py-4 flex items-center justify-between">
            <h1 className="text-white text-xl font-medium">Member Chats</h1>
            <SearchOutlined className="text-white text-xl cursor-pointer" />
          </div>

          {/* Search Bar */}
          <div className="px-3 py-2 bg-white border-b border-[#E9EDEF]">
            <Select
              showSearch
              placeholder="Select member to view chats..."
              optionFilterProp="children"
              value={selectedMemberId}
              onChange={(value) => setSelectedMemberId(value)}
              allowClear
              style={{ width: '100%' }}
              size="large"
              virtual
              listHeight={400}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                (option?.email ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={memberOptions}
              optionRender={(option) => (
                <div className="flex flex-col">
                  <span className="font-medium">{option.data.label}</span>
                  <span className="text-xs text-gray-500">{option.data.email}</span>
                </div>
              )}
            />
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spin size="large" />
              </div>
            ) : filteredList.length > 0 ? (
              filteredList.map((item, idx) => (
                <div
                  key={`${item.roomId}-${idx}`}
                  onClick={() => handleRoomClick(item)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#E9EDEF] hover:bg-[#F5F6F6] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: activeRoomId === item.roomId ? '#F0F2F5' : 'transparent'
                  }}
                >
                  <Avatar
                    size={50}
                    src={item.memberAvatar}
                    style={{ backgroundColor: primaryColor, flexShrink: 0 }}
                  >
                    {item.memberName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[#111B21] text-[16px] truncate">
                        {item.memberName}
                      </p>
                      <span className="text-xs text-[#667781]">
                        {new Date(item.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#667781] truncate">
                        {item.roomType === 'GROUP' ? `📁 ${item.roomName}` : item.lastMessage || 'No messages'}
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

        {/* Right: Chat Window */}
        <div className="flex-1 flex flex-col">
          {activeRoomId ? (
            <ChatWindow
              showMobileHeader={false}
              readOnly={true}
              onBack={() => dispatch(setActiveRoom(''))}
            />
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