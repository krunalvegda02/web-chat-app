import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../hooks/useTheme';
import RoomList from './RoomList';
import ChatWindow from './ChatWindow';
import {
  Modal,
  Input,
  Avatar,
  message,
  Spin,
  Button,
  Empty,
  Badge,
  Typography,
  Switch,
} from 'antd';
import {
  SearchOutlined,
  MailOutlined,
  CloseOutlined,
  UserAddOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  createDirectRoom,
  createAdminChat,
  setActiveRoom,
  fetchRooms,
  fetchAvailableUsers,
} from '../../redux/slices/chatSlice';

const { Text } = Typography;

export default function StandardChatLayout() {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { activeRoomId } = useSelector((s) => s.chat);

  const [showModal, setShowModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [chatOpened, setChatOpened] = useState(false);
  const [contactsOnly, setContactsOnly] = useState(false);

  useSocket();

  const handlePlusClick = async () => {
    setShowModal(true);
    setSearchUserTerm('');
    setLoadingUsers(true);
    try {
      const result = await dispatch(fetchAvailableUsers({ contactsOnly })).unwrap();
      setAvailableUsers(result?.data?.users || result?.users || []);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateRoom = async (selectedUser) => {
    try {
      setCreatingRoom(true);
      const currentUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(user?.role);
      const selectedUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(selectedUser.role);
      const isAdminChat = currentUserIsAdmin && selectedUserIsAdmin;

      const result = isAdminChat
        ? await dispatch(createAdminChat({ adminId: selectedUser._id })).unwrap()
        : await dispatch(createDirectRoom({ userId: selectedUser._id })).unwrap();

      const roomId = result?.data?.room?._id || result?.room?._id || result?._id;

      if (roomId) {
        dispatch(setActiveRoom(roomId));
        dispatch(fetchRooms());
        setChatOpened(true);
        message.success('Chat opened successfully');
      }
      setShowModal(false);
    } catch (error) {
      message.error('Failed to create chat');
    } finally {
      setCreatingRoom(false);
    }
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchUserTerm.toLowerCase())
  );

  const getRoleBadgeColor = useCallback((role) => {
    switch (role) {
      case 'ADMIN':
      case 'TENANT_ADMIN':
        return '#EF4444';
      case 'SUPER_ADMIN':
        return '#8B5CF6';
      case 'USER':
        return '#00A884';
      default:
        return '#9CA3AF';
    }
  }, []);

  const getRoleDisplayName = useCallback((role) => {
    const roleMap = {
      'ADMIN': 'Admin',
      'TENANT_ADMIN': 'Tenant Admin',
      'SUPER_ADMIN': 'Super Admin',
      'USER': 'User',
    };
    return roleMap[role] || role;
  }, []);

  const primaryColor = '#008069';

  // Mobile: Show room list or chat based on chatOpened state
  if (window.innerWidth < 768) {
    if (chatOpened && activeRoomId) {
      return (
        <>
          <style>{`
            body { overflow: hidden !important; }
            nav[class*="bottom-0"] { display: none !important; }
          `}</style>
          <div className="fixed inset-0 flex flex-col bg-white z-[150]" style={{ overflow: 'hidden' }}>
            <ChatWindow 
              showMobileHeader={true}
              onBack={() => {
                dispatch(setActiveRoom(''));
                setTimeout(() => setChatOpened(false), 0);
              }}
            />
          </div>
        </>
      );
    }
    
    // Show room list when chat is not opened
    return (
      <>
        <style>{`body { overflow: hidden !important; }`}</style>
        <div className="fixed top-0 left-0 right-0 bottom-14 flex flex-col bg-[#F0F2F5] z-10" style={{ overflow: 'hidden' }}>
          <div className="flex-1 overflow-hidden">
            <RoomList onCreateRoom={handlePlusClick} onRoomClick={() => setChatOpened(true)} />
          </div>
        </div>

        <Modal
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                <UserAddOutlined style={{ color: primaryColor, fontSize: '18px' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>Start New Chat</span>
            </div>
          }
          open={showModal}
          onCancel={() => setShowModal(false)}
          footer={null}
          width={500}
          centered
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <Text style={{ fontSize: '13px', color: '#6B7280' }}>Show contacts only</Text>
              <Switch 
                checked={contactsOnly} 
                onChange={async (checked) => {
                  setContactsOnly(checked);
                  setLoadingUsers(true);
                  try {
                    const result = await dispatch(fetchAvailableUsers({ contactsOnly: checked })).unwrap();
                    setAvailableUsers(result?.data?.users || result?.users || []);
                  } catch (error) {
                    message.error('Failed to load users');
                  } finally {
                    setLoadingUsers(false);
                  }
                }}
                style={{ backgroundColor: contactsOnly ? primaryColor : undefined }}
              />
            </div>
            <Input
              placeholder="Search by name or email..."
              prefix={<SearchOutlined style={{ color: primaryColor }} />}
              suffix={
                searchUserTerm && (
                  <CloseOutlined
                    style={{ cursor: 'pointer', color: '#9CA3AF' }}
                    onClick={() => setSearchUserTerm('')}
                  />
                )
              }
              value={searchUserTerm}
              onChange={(e) => setSearchUserTerm(e.target.value)}
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {creatingRoom || loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin tip={creatingRoom ? 'Creating chat...' : 'Loading users...'} />
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-2">
                {filteredUsers.map((userItem) => (
                  <div
                    key={userItem._id}
                    onClick={() => !creatingRoom && handleCreateRoom(userItem)}
                    className="p-3 rounded-lg cursor-pointer transition-all"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      opacity: creatingRoom ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size={44} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                        {userItem.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Text strong style={{ fontSize: '14px' }}>{userItem.name}</Text>
                          <Badge
                            color={getRoleBadgeColor(userItem.role)}
                            text={getRoleDisplayName(userItem.role)}
                            style={{ fontSize: '11px' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          {userItem.phone && (
                            <div className="flex items-center gap-1">
                              <PhoneOutlined style={{ color: primaryColor, fontSize: '11px' }} />
                              <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.phone}</Text>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MailOutlined style={{ color: primaryColor, fontSize: '11px' }} />
                            <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.email}</Text>
                          </div>
                        </div>
                      </div>
                      <MessageOutlined style={{ color: primaryColor, fontSize: '18px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No users found" />
            )}
          </div>

          {filteredUsers.length > 0 && (
            <div
              className="mt-4 p-3 rounded-lg flex items-start gap-2"
              style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
            >
              <CheckCircleOutlined style={{ color: primaryColor, fontSize: '16px', marginTop: '2px' }} />
              <div>
                <Text strong style={{ color: primaryColor, display: 'block', fontSize: '13px' }}>
                  Ready to Chat
                </Text>
                <Text style={{ color: '#6B7280', fontSize: '12px' }}>
                  Click on any user to start chatting
                </Text>
              </div>
            </div>
          )}
        </Modal>
      </>
    );
  }

  // Desktop: Split view with rooms on left, chat on right
  return (
    <>
      <style>{`body { overflow: hidden !important; }`}</style>
      <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex bg-white" style={{ overflow: 'hidden' }}>
        {/* Left: Room List */}
        <div className="hidden md:flex w-96 flex-col border-r border-[#E9EDEF]">
          <RoomList onCreateRoom={handlePlusClick} />
        </div>

        {/* Right: Chat Window */}
        <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
          {activeRoomId ? (
            <ChatWindow 
              showMobileHeader={false}
              onBack={() => dispatch(setActiveRoom(''))}
            />
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-[#F0F2F5]">
              <Empty
                image={<MessageOutlined style={{ fontSize: '64px', color: '#8696A0' }} />}
                description={
                  <span className="text-[#667781] text-sm">
                    Select a chat to start messaging
                  </span>
                }
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
              <UserAddOutlined style={{ color: primaryColor, fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>Start New Chat</span>
          </div>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={500}
        centered
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <Text style={{ fontSize: '13px', color: '#6B7280' }}>Show contacts only</Text>
            <Switch 
              checked={contactsOnly} 
              onChange={async (checked) => {
                setContactsOnly(checked);
                setLoadingUsers(true);
                try {
                  const result = await dispatch(fetchAvailableUsers({ contactsOnly: checked })).unwrap();
                  setAvailableUsers(result?.data?.users || result?.users || []);
                } catch (error) {
                  message.error('Failed to load users');
                } finally {
                  setLoadingUsers(false);
                }
              }}
              style={{ backgroundColor: contactsOnly ? primaryColor : undefined }}
            />
          </div>
          <Input
            placeholder="Search by name or email..."
            prefix={<SearchOutlined style={{ color: primaryColor }} />}
            suffix={
              searchUserTerm && (
                <CloseOutlined
                  style={{ cursor: 'pointer', color: '#9CA3AF' }}
                  onClick={() => setSearchUserTerm('')}
                />
              )
            }
            value={searchUserTerm}
            onChange={(e) => setSearchUserTerm(e.target.value)}
            size="large"
            style={{ borderRadius: '8px' }}
          />
          <Text style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '8px', display: 'block' }}>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} available
          </Text>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {creatingRoom || loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin tip={creatingRoom ? 'Creating chat...' : 'Loading users...'} />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map((userItem) => (
                <div
                  key={userItem._id}
                  onClick={() => !creatingRoom && handleCreateRoom(userItem)}
                  className="p-3 rounded-lg cursor-pointer transition-all group"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    opacity: creatingRoom ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1F4E0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <div className="flex items-center gap-3">
                    <Avatar size={44} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                      {userItem.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Text strong style={{ fontSize: '14px' }}>{userItem.name}</Text>
                          <Badge
                            color={getRoleBadgeColor(userItem.role)}
                            text={getRoleDisplayName(userItem.role)}
                            style={{ fontSize: '11px' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          {userItem.phone && (
                            <div className="flex items-center gap-1">
                              <PhoneOutlined style={{ color: primaryColor, fontSize: '11px' }} />
                              <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.phone}</Text>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MailOutlined style={{ color: primaryColor, fontSize: '11px' }} />
                            <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.email}</Text>
                          </div>
                        </div>
                      </div>
                    <Button
                      type="primary"
                      icon={<MessageOutlined />}
                      size="small"
                      style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No users found" />
          )}
        </div>

        {filteredUsers.length > 0 && (
          <div
            className="mt-4 p-3 rounded-lg flex items-start gap-2"
            style={{ backgroundColor: `${primaryColor}10`, border: `2px solid ${primaryColor}30` }}
          >
            <CheckCircleOutlined style={{ color: primaryColor, fontSize: '16px', marginTop: '2px' }} />
            <div>
              <Text strong style={{ color: primaryColor, display: 'block', fontSize: '13px' }}>
                Ready to Chat
              </Text>
              <Text style={{ color: '#00A884', fontSize: '12px' }}>
                Select a contact to start a secure conversation
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}