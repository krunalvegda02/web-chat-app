import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  Pagination,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  MailOutlined,
  UserAddOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  createDirectRoom,
  createAdminChat,
  setActiveRoom,
  fetchRooms,
  fetchAvailableUsers,
} from '../../redux/slices/chatSlice';
import { _get, _post } from '../../helper/apiClient';

const { Text } = Typography;

export default function StandardChatLayout({ roomFilter = null }) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((s) => s.auth);
  const { activeRoomId } = useSelector((s) => s.chat);

  const [showModal, setShowModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [chatOpened, setChatOpened] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useSocket();

  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId && roomId !== activeRoomId) {
      dispatch(setActiveRoom(roomId));
      setChatOpened(true);
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    if (activeRoomId) {
      navigate(`?room=${activeRoomId}`, { replace: true });
      setChatOpened(true);
    } else {
      navigate(location.pathname, { replace: true });
      setChatOpened(false);
    }
  }, [activeRoomId, navigate, location.pathname]);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = ['ADMIN', 'TENANT_ADMIN'].includes(user?.role);
  const isRegularUser = user?.role === 'USER';
  const isNonSuperAdmin = isAdmin || isRegularUser;

  const handlePlusClick = async () => {
    setShowModal(true);
    setSearchUserTerm('');
    setSearchResults([]);
    setAvailableUsers([]);
    setCurrentPage(1);

    if (isSuperAdmin) {
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    try {
      if (isNonSuperAdmin) {
        const response = await _get('/contacts');
        const contacts = response?.data?.contacts || response?.data?.data?.contacts || [];
        setAvailableUsers(
          contacts.map((c) => ({
            _id: c.userId?._id || c.userId,
            name: c.userId?.name || c.name,
            email: c.userId?.email || c.email,
            phone: c.userId?.phone || c.phone,
            avatar: c.userId?.avatar || c.avatar,
            role: c.userId?.role || c.role,
            contactName: c.contactName,
          }))
        );
      }
    } catch (error) {
      message.error('Failed to load contacts');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearchClick = async () => {
    if (!searchUserTerm.trim()) {
      setSearchResults([]);
      setCurrentPage(1);
      return;
    }

    setCurrentPage(1);
    setSearchLoading(true);
    try {
      const response = await _get(`/users/search?query=${searchUserTerm}`);
      console.log('Full API response:', response);
      const users = response?.data?.data?.users || [];
      console.log('Extracted users:', users);
      const mappedUsers = users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email?.replace('mailto:', '') || u.email,
        phone: u.phone,
        avatar: u.avatar,
        role: u.role,
        isSearchResult: true,
      }));
      console.log('Search results:', mappedUsers);
      setSearchResults(mappedUsers);
    } catch (error) {
      console.error('Search error:', error);
      message.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const isUserInContacts = useCallback(
    (userId) => {
      return availableUsers.some((u) => u._id === userId);
    },
    [availableUsers]
  );

  const handleAddContactAndChat = async (selectedUser) => {
    try {
      setCreatingRoom(true);

      try {
        await _post('/contacts/add', {
          identifier: selectedUser.email || selectedUser.phone,
          contactName: selectedUser.name,
        });
        message.success('Contact added');
      } catch (error) {
        if (error.response?.status !== 400) {
          throw error;
        }
      }

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
        setShowModal(false);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to create chat');
    } finally {
      setCreatingRoom(false);
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
        setShowModal(false);
      }
    } catch (error) {
      message.error('Failed to create chat');
    } finally {
      setCreatingRoom(false);
    }
  };

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

  const sortedUsers = useMemo(() => {
    const users = searchUserTerm.trim() ? searchResults : availableUsers;
    console.log('sortedUsers - searchUserTerm:', searchUserTerm, 'searchResults:', searchResults, 'availableUsers:', availableUsers, 'users:', users);
    return [...users].sort((a, b) => {
      const nameA = (a.contactName || a.name || '').toLowerCase();
      const nameB = (b.contactName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [searchUserTerm, searchResults, availableUsers]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, currentPage]);

  const paginatedGroupedUsers = useMemo(() => {
    const groups = {};
    paginatedUsers.forEach(user => {
      const firstLetter = (user.contactName || user.name || '?').charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(user);
    });
    return groups;
  }, [paginatedUsers]);

  const totalUsers = sortedUsers.length;
  const primaryColor = theme?.primaryColor || '#008069';

  if (window.innerWidth < 768) {
    if (chatOpened && activeRoomId) {
      return (
        <>
          <style>{`body { overflow: hidden !important; }`}</style>
          <div className="fixed inset-0 flex flex-col z-[150]" style={{ backgroundColor: theme?.backgroundColor || '#FFFFFF', overflow: 'hidden' }}>
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
    
    return (
      <>
        <style>{`body { overflow: hidden !important; }`}</style>
        <div className="fixed top-0 left-0 right-0 bottom-14 flex flex-col z-10" style={{ backgroundColor: theme?.backgroundColor || '#F0F2F5', overflow: 'hidden' }}>
          <div className="flex-1 overflow-hidden">
            <RoomList onCreateRoom={handlePlusClick} onRoomClick={() => setChatOpened(true)} roomFilter={roomFilter} />
          </div>
        </div>

        <Modal
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                <UserAddOutlined style={{ color: primaryColor, fontSize: '18px' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                {isSuperAdmin ? 'Search and find Users to chat' : 'My Contacts'}
              </span>
            </div>
          }
          open={showModal}
          onCancel={() => setShowModal(false)}
          footer={null}
          width={500}
          centered
        >
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                placeholder={isSuperAdmin ? "Search by name, email or phone..." : "Search contacts..."}
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
                onPressEnter={handleSearchClick}
                size="large"
                style={{ borderRadius: '8px', flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearchClick}
                loading={searchLoading}
                size="large"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              >
                Search
              </Button>
            </div>
          </div>

          <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
            {creatingRoom || loadingUsers || searchLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin tip={creatingRoom ? 'Creating chat...' : searchLoading ? 'Searching...' : 'Loading...'} />
              </div>
            ) : totalUsers > 0 ? (
              <>
                <div className="space-y-1">
                  {paginatedUsers.map((userItem) => (
                    <div
                      key={userItem._id}
                      className="px-4 py-3 cursor-pointer transition-all"
                      style={{
                        backgroundColor: '#FFFFFF',
                        opacity: creatingRoom ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      onClick={() => {
                        if (isNonSuperAdmin && userItem.isSearchResult && !isUserInContacts(userItem._id)) {
                          handleAddContactAndChat(userItem);
                        } else {
                          handleCreateRoom(userItem);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar size={48} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                          {userItem.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Text strong style={{ fontSize: '16px', display: 'block' }}>
                            {userItem.contactName || userItem.name}
                          </Text>
                          <Text style={{ color: '#667781', fontSize: '14px', display: 'block' }}>
                            {userItem.phone || userItem.email}
                          </Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {totalUsers > pageSize && (
                  <div style={{ marginTop: '16px', textAlign: 'center', paddingBottom: '8px' }}>
                    <Pagination
                      current={currentPage}
                      total={totalUsers}
                      pageSize={pageSize}
                      onChange={(page) => setCurrentPage(page)}
                      showSizeChanger={false}
                      size="small"
                    />
                  </div>
                )}
              </>
            ) : (
              <Empty 
                description={
                  isSuperAdmin
                    ? 'Search by name, email or phone to find users'
                    : searchUserTerm
                    ? 'No users found'
                    : 'No contacts yet. Search to add new contacts.'
                }
              />
            )}
          </div>

          {totalUsers > 0 && (
            <div
              style={{
                borderTop: '1px solid #E9EDEF',
                padding: '12px 16px',
                backgroundColor: '#F5F5F5',
                marginTop: '8px'
              }}
            >
              <Text style={{ color: '#667781', fontSize: '14px' }}>
                {totalUsers} contact{totalUsers !== 1 ? 's' : ''}
              </Text>
            </div>
          )}
        </Modal>
      </>
    );
  }

  return (
    <>
      <style>{`body { overflow: hidden !important; }`}</style>
      <div className="fixed top-0 right-0 bottom-0 left-0 md:left-20 flex" style={{ backgroundColor: theme?.backgroundColor || '#FFFFFF', overflow: 'hidden' }}>
        <div className="hidden md:flex w-96 flex-col" style={{ borderRight: `1px solid ${theme?.sidebarBorderColor || '#E9EDEF'}` }}>
          <RoomList onCreateRoom={handlePlusClick} roomFilter={roomFilter} />
        </div>

        <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
          {activeRoomId ? (
            <ChatWindow 
              showMobileHeader={false}
              onBack={() => dispatch(setActiveRoom(''))}
            />
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center" style={{ backgroundColor: theme?.chatBackgroundColor || '#F0F2F5' }}>
              <Empty
                image={<MessageOutlined style={{ fontSize: '64px', color: theme?.timestampColor || '#8696A0' }} />}
                description={
                  <span style={{ color: theme?.timestampColor || '#667781', fontSize: '14px' }}>
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
            <span style={{ fontSize: '16px', fontWeight: 600 }}>
              {isSuperAdmin ? 'Search and find Users to chat' : 'My Contacts'}
            </span>
          </div>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={500}
        centered
      >
        <div className="mb-4">
          <div className="flex gap-2">
            <Input
              placeholder={isSuperAdmin ? "Search by name, email or phone..." : "Search contacts..."}
              value={searchUserTerm}
              onChange={(e) => setSearchUserTerm(e.target.value)}
              onPressEnter={handleSearchClick}
              size="large"
              style={{ borderRadius: '8px', flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearchClick}
              loading={searchLoading}
              size="large"
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            >
              Search
            </Button>
          </div>
        </div>

        <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
          {creatingRoom || loadingUsers || searchLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin tip={creatingRoom ? 'Creating chat...' : searchLoading ? 'Searching...' : 'Loading...'} />
            </div>
          ) : totalUsers > 0 ? (
            <>
              <div className="space-y-1">
                {paginatedUsers.map((userItem) => (
                  <div
                    key={userItem._id}
                    className="px-4 py-3 cursor-pointer transition-all"
                    style={{
                      backgroundColor: '#FFFFFF',
                      opacity: creatingRoom ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    onClick={() => {
                      if (isNonSuperAdmin && userItem.isSearchResult && !isUserInContacts(userItem._id)) {
                        handleAddContactAndChat(userItem);
                      } else {
                        handleCreateRoom(userItem);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size={48} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                        {userItem.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Text strong style={{ fontSize: '16px', display: 'block' }}>
                          {userItem.contactName || userItem.name}
                        </Text>
                        <Text style={{ color: '#667781', fontSize: '14px', display: 'block' }}>
                          {userItem.email}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalUsers > pageSize && (
                <div style={{ marginTop: '16px', textAlign: 'center', paddingBottom: '8px' }}>
                  <Pagination
                    current={currentPage}
                    total={totalUsers}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              )}
            </>
          ) : (
            <Empty
              description={
                isSuperAdmin
                  ? 'Search by name, email or phone to find users'
                  : searchUserTerm
                  ? 'No users found'
                  : 'No contacts yet. Search to add new contacts.'
              }
            />
          )}
        </div>

        {totalUsers > 0 && (
          <div
            style={{
              borderTop: '1px solid #E9EDEF',
              padding: '12px 16px',
              backgroundColor: '#F5F5F5',
              marginTop: '8px'
            }}
          >
            <Text style={{ color: '#667781', fontSize: '14px' }}>
              {totalUsers} contact{totalUsers !== 1 ? 's' : ''}
            </Text>
          </div>
        )}
      </Modal>
    </>
  );
}
