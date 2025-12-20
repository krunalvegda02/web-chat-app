import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useTheme } from '../../hooks/useTheme';
import { useDispatch, useSelector } from 'react-redux';
import { getAllTenants } from '../../redux/slices/tenantSlice';
import { setActiveRoom, fetchMessages } from '../../redux/slices/chatSlice';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get } from '../../helper/apiClient';
import ChatWindow from '../../components/chat/ChatWindow';
import {
  Empty,
  Avatar,
  Badge,
  Input,
  Spin,
  Select,
} from 'antd';
import {
  SearchOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const fetchAdminChats = createAsyncThunkHandler(
  'chat/fetchAdminChats',
  _get,
  (adminId) => `/chat/admin/chats/${adminId}`
);

export default function SuperAdminAdminChats() {
  const { theme } = useTheme();
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();
  const { tenants } = useSelector((state) => state.tenant);
  const { activeRoomId, messagesByRoom } = useSelector((s) => s.chat);

  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [chatOpened, setChatOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(getAllTenants());
  }, [dispatch]);

console.log(useSelector(state => state.auth))

  useEffect(() => {
    // Auto-fetch chats for all admins
    const fetchAllChats = async () => {
      setLoading(true);
      const allChats = [];
      for (const tenant of tenants || []) {
        if (tenant.admin?._id) {
          try {
            const result = await dispatch(fetchAdminChats(tenant.admin._id));
            if (result.payload?.data?.chats) {
              result.payload.data.chats.forEach(chat => {
                allChats.push({
                  ...chat,
                  adminId: tenant.admin._id,
                  adminName: tenant.admin.name,
                  adminEmail: tenant.admin.email,
                  adminPhone: tenant.admin.phone,
                });
              });
            }
          } catch (error) {
            console.error('Failed to fetch chats for admin:', tenant.admin._id);
          }
        }
      }
      setCombinedChats(allChats);
      setLoading(false);
    };

    if (tenants && tenants.length > 0) {
      fetchAllChats();
    }
  }, [tenants, dispatch]);

  const [combinedChats, setCombinedChats] = useState([]);

  const handleChatSelect = async (chat) => {
    dispatch(setActiveRoom(chat.roomId));
    setChatOpened(true);
  };

  if (!user) return null;

  // Filter combined chats by search term
  const filteredChats = combinedChats.filter(chat =>
    chat.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.participantEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  // Extract unique participants from all chats (admins + users)
  const allParticipants = new Map();
  
  // Add admins
  (tenants || []).forEach(tenant => {
    if (tenant.admin?._id) {
      allParticipants.set(tenant.admin._id, {
        value: tenant.admin._id,
        label: tenant.admin.name,
        email: tenant.admin.email,
        phone: tenant.admin.phone,
        type: 'ADMIN'
      });
    }
  });
  
  // Add participants from chats
  combinedChats.forEach(chat => {
    if (chat.participantId) {
      allParticipants.set(chat.participantId, {
        value: chat.participantId,
        label: chat.participantName,
        email: chat.participantEmail || '',
        type: 'USER'
      });
    }
  });

  const adminOptions = Array.from(allParticipants.values());

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
              <h1 className="text-white text-xl font-medium flex-1">Monitor Chats</h1>
              <SearchOutlined className="text-white text-xl" />
            </div>

            {/* Search Bar */}
            <div className="bg-white px-3 py-2 border-b border-[#E9EDEF]">
              <Input
                placeholder="Search or start new chat"
                prefix={<SearchOutlined style={{ color: '#667781' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                style={{
                  borderRadius: '8px',
                  backgroundColor: '#F0F2F5',
                  border: 'none',
                }}
                size="large"
              />
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto bg-white">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" />
                </div>
              ) : filteredChats.length > 0 ? (
                filteredChats.map((chat, idx) => (
                  <div
                    key={`${chat.roomId}-${idx}`}
                    onClick={() => handleChatSelect(chat)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#E9EDEF] hover:bg-[#F5F6F6] cursor-pointer active:bg-[#E9EDEF] transition-colors"
                  >
                    <Avatar
                      size={50}
                      style={{ backgroundColor: primaryColor, flexShrink: 0 }}
                    >
                      {chat.participantName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-[#111B21] text-[16px] truncate">
                          {chat.participantName}
                        </p>
                        <span className="text-xs text-[#667781]">
                          {new Date(chat.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#667781] truncate">
                          Admin: {chat.adminName}
                        </p>
                        {chat.messageCount > 0 && (
                          <Badge
                            count={chat.messageCount}
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
          <div className="bg-[#008069] px-4 py-[19px] flex items-center justify-between">
            <h1 className="text-white text-xl font-medium">Monitor Chats</h1>
            <SearchOutlined className="text-white text-xl cursor-pointer" />
          </div>

          {/* Search Bar */}
          <div className="px-3 py-2 bg-white border-b border-[#E9EDEF]">
            <Input
              placeholder="Search or start new chat"
              prefix={<SearchOutlined style={{ color: '#667781' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{
                borderRadius: '8px',
                backgroundColor: '#F0F2F5',
                border: 'none',
              }}
              size="large"
            />
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spin size="large" />
              </div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat, idx) => (
                <div
                  key={`${chat.roomId}-${idx}`}
                  onClick={() => handleChatSelect(chat)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#E9EDEF] hover:bg-[#F5F6F6] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: activeRoomId === chat.roomId ? '#F0F2F5' : 'transparent'
                  }}
                >
                  <Avatar
                    size={50}
                    style={{ backgroundColor: primaryColor, flexShrink: 0 }}
                  >
                    {chat.participantName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[#111B21] text-[16px] truncate">
                        {chat.participantName}
                      </p>
                      <span className="text-xs text-[#667781]">
                        {new Date(chat.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#667781] truncate">
                        Admin: {chat.adminName}
                      </p>
                      {chat.messageCount > 0 && (
                        <Badge
                          count={chat.messageCount}
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
