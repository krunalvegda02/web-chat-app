import { useState, useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
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
  Typography,
  Pagination,
} from 'antd';
import {
  SearchOutlined,
  UserAddOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  createOrGetRoom,
  setActiveRoom,
  fetchRooms,
} from '../../redux/slices/chatSlice';
import { _get, _post } from '../../helper/apiClient';

const { Text } = Typography;

function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(max-width: 767px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(max-width: 767px)').matches,
    () => false
  );
}

export default function StandardChatLayout({ roomFilter = null }) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chatOpened, setChatOpened] = useState(false);
  const isMobile = useIsMobile();

  const { user } = useSelector((s) => s.auth);
  const { activeRoomId } = useSelector((s) => s.chat);

  // Check if this is a platform user
  const isPlatformUser = user?.role === 'USER' && (user?.platformId || user?.externalUserId);

  // For platform users on mobile, always show chat if there's an active room
  const shouldShowChatOnMobile = chatOpened && activeRoomId;

  // For platform users, force chat opened state if there's an active room
  useEffect(() => {
    if (isPlatformUser && activeRoomId && !chatOpened) {
      console.log('📱 [StandardChatLayout] Platform user with active room, opening chat');
      setChatOpened(true);
    }
  }, [isPlatformUser, activeRoomId, chatOpened]);

  const [showModal, setShowModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  useSocket();

  const prevUrlRoomId = useRef();

  // Unified URL <-> Redux Sync Effect
  useEffect(() => {
    let urlRoomId = searchParams.get('room') || searchParams.get('roomId');

    // Check if we are on the /user/chats page
    if (location.pathname.startsWith('/user/chats/')) {
      urlRoomId = location.pathname.split('/user/chats/')[1] || null;
    } else if (location.pathname === '/user/chats') {
      urlRoomId = null;
    }

    // Only attempt sync if they are out of sync
    if (urlRoomId !== activeRoomId) {
      if (urlRoomId !== prevUrlRoomId.current) {
        // The URL changed! (e.g., user clicked Back, or landed on a new page) -> Sync to Redux
        console.log('🔗 [StandardChatLayout] URL changed. Syncing purely from URL to Redux:', urlRoomId);
        dispatch(setActiveRoom(urlRoomId || null));
        setChatOpened(!!urlRoomId);
      } else {
        // The URL did not change, but activeRoomId changed! (e.g., user clicked a room) -> Sync to URL
        console.log('🔗 [StandardChatLayout] Redux changed. Syncing purely from Redux to URL:', activeRoomId);
        if (activeRoomId) {
          if (location.pathname.startsWith('/user/chats')) {
            navigate(`/user/chats/${activeRoomId}`, { replace: true });
          } else {
            navigate(`?room=${activeRoomId}`, { replace: true });
          }
          setChatOpened(true);
        } else {
          if (location.pathname.startsWith('/user/chats')) {
            navigate(`/user/chats`, { replace: true });
          } else {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('room');
            newParams.delete('roomId');
            navigate({ pathname: location.pathname, search: newParams.toString() }, { replace: true });
          }
          setChatOpened(false);
        }
      }
    }

    // Always keep track of what the URL room ID was LAST seen as
    prevUrlRoomId.current = urlRoomId;
  }, [location.pathname, searchParams, activeRoomId, dispatch, navigate]);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = ['ADMIN', 'PLATFORM_ADMIN'].includes(user?.role);
  const isRegularUser = user?.role === 'USER';
  const isNonSuperAdmin = isAdmin || isRegularUser;

  const handlePlusClick = async () => {
    setShowModal(true);
    setSearchUserTerm('');
    setSearchResults([]);
    setAvailableUsers([]);
    setCurrentPage(1);

    setLoadingUsers(true);
    try {
      const response = await _get('/chat/available-users');
      const users = response?.data?.users || response?.data?.data?.users || [];
      setAvailableUsers(users);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateRoom = async (selectedUser) => {
    try {
      setCreatingRoom(true);

      const result = await dispatch(createOrGetRoom({ userId: selectedUser._id })).unwrap();

      const roomId = result?.data?.room?._id || result?.room?._id || result?._id;

      if (roomId) {
        dispatch(setActiveRoom(roomId));
        await dispatch(fetchRooms());
        setChatOpened(true);
        setShowModal(false);
      }
    } catch (error) {
      message.error('Failed to create chat');
    } finally {
      setCreatingRoom(false);
    }
  };

  const sortedUsers = useMemo(() => {
    let users = availableUsers;

    if (searchUserTerm.trim()) {
      const query = searchUserTerm.toLowerCase();
      users = availableUsers.filter(u => {
        const name = (u.name || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        return name.includes(query) || phone.includes(query);
      });
    }

    return [...users].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [searchUserTerm, availableUsers]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, currentPage]);

  const groupedUsers = useMemo(() => {
    const groups = {};
    paginatedUsers.forEach(user => {
      const firstLetter = (user.name || '?').charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(user);
    });
    return groups;
  }, [paginatedUsers]);

  const alphabetIndex = useMemo(() => {
    return Object.keys(groupedUsers).sort();
  }, [groupedUsers]);

  const totalUsers = sortedUsers.length;
  const primaryColor = theme?.primaryColor || '#008069';

  const renderContactList = () => (
    <div style={{ maxHeight: '450px', overflowY: 'auto', position: 'relative' }}>
      {creatingRoom || loadingUsers || searchLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin tip={creatingRoom ? 'Creating chat...' : searchLoading ? 'Searching...' : 'Loading...'} />
        </div>
      ) : totalUsers > 0 ? (
        <>
          {alphabetIndex.map((letter) => (
            <div key={letter} id={`letter-${letter}`}>
              <div style={{ padding: '8px 16px', backgroundColor: '#F5F5F5', position: 'sticky', top: 0, zIndex: 1 }}>
                <Text strong style={{ color: primaryColor, fontSize: '14px' }}>{letter}</Text>
              </div>
              {groupedUsers[letter].map((userItem) => (
                <div
                  key={userItem._id}
                  className="px-4 py-3 cursor-pointer transition-all"
                  style={{
                    backgroundColor: '#FFFFFF',
                    opacity: creatingRoom ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  onClick={() => handleCreateRoom(userItem)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar size={48} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                      {userItem.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Text strong style={{ fontSize: '16px', display: 'block' }}>
                        {userItem.name}
                      </Text>
                      <Text style={{ color: '#667781', fontSize: '14px', display: 'block' }}>
                        {userItem.phone || userItem.email}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Alphabet Index - WhatsApp Style */}
          <div style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10
          }}>
            {alphabetIndex.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                style={{
                  fontSize: '10px',
                  color: '#54656F',
                  fontWeight: 500,
                  textDecoration: 'none',
                  padding: '1px 3px',
                  lineHeight: '1',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                {letter}
              </a>
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
        <Empty description="No users found" />
      )}
    </div>
  );

  if (isMobile) {
    if (shouldShowChatOnMobile) {
      return (
        <>
          <style>{`body { overflow: hidden !important; }`}</style>
          <div className="chat-fullscreen left-0 flex flex-col z-[150]" style={{ backgroundColor: theme?.backgroundColor || '#FFFFFF', overflow: 'hidden' }}>
            <ChatWindow
              showMobileHeader={true}
              onBack={() => {
                // For platform users, don't allow going back to room list
                if (isPlatformUser) {
                  console.log('🚫 [StandardChatLayout] Platform user cannot go back to room list');
                  return;
                }
                dispatch(setActiveRoom(''));
                setTimeout(() => setChatOpened(false), 0);
              }}
            />
          </div>
        </>
      );
    }

    // For platform users, don't show room list - they should be directly in chat
    if (isPlatformUser) {
      return (
        <>
          <style>{`body { overflow: hidden !important; }`}</style>
          <div className="chat-fullscreen left-0 flex flex-col z-10" style={{ backgroundColor: theme?.backgroundColor || '#F0F2F5', overflow: 'hidden' }}>
            <div className="flex-1 flex items-center justify-center">
              <Spin size="large" tip="Loading chat..." />
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <style>{`body { overflow: hidden !important; }`}</style>
        <div className="chat-fullscreen left-0 flex flex-col z-10" style={{ backgroundColor: theme?.backgroundColor || '#F0F2F5', overflow: 'hidden' }}>
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
                Select User
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
            <Input
              placeholder="Search users..."
              value={searchUserTerm}
              onChange={(e) => setSearchUserTerm(e.target.value)}
              size="large"
              prefix={<SearchOutlined style={{ color: '#8696A0' }} />}
              style={{ borderRadius: '8px' }}
            />
          </div>

          {renderContactList()}

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
                {totalUsers} user{totalUsers !== 1 ? 's' : ''}
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
      <div className="chat-fullscreen md:left-20 flex" style={{ backgroundColor: theme?.backgroundColor || '#FFFFFF', overflow: 'hidden' }}>
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
              Select User
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
          <Input
            placeholder="Search users..."
            value={searchUserTerm}
            onChange={(e) => setSearchUserTerm(e.target.value)}
            size="large"
            prefix={<SearchOutlined style={{ color: '#8696A0' }} />}
            style={{ borderRadius: '8px' }}
          />
        </div>

        {renderContactList()}

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
              {totalUsers} user{totalUsers !== 1 ? 's' : ''}
            </Text>
          </div>
        )}
      </Modal>
    </>
  );
}
