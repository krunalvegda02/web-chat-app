
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchMessages,
  joinRoomThunk,
  setActiveRoom,
} from '../../redux/slices/chatSlice';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Spin, Empty, Button, Space, Tooltip, message, Input } from 'antd';
import {
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
  MessageOutlined,
  SearchOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import OnlineStatus from './OnlineStatus';
import TypingIndicator from './TypingIndicator';
import { useTheme } from '../../hooks/useTheme';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useCall } from '../../contexts/CallContext';
import { chatSocketClient } from '../../sockets/chatSocketClient';
import whatsappBg from '../../assets/whatsapp-bg.webp';

export default function ChatWindow({ isMobile = false, showMobileHeader = false, onBack, readOnly = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { joinRoom, leaveRoom, markMessagesAsRead } = useChatSocket();
  const { callState, initiateCall } = useCall();

  const {
    activeRoomId,
    messagesByRoom,
    loadingMessages,
    rooms,
    onlineUsers,
  } = useSelector((s) => s.chat);

  const { user } = useSelector((s) => s.auth);
  const [roomDetails, setRoomDetails] = useState(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const hasJoinedRoom = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const previousMessagesLength = useRef(0);

  // Check if user is a platform user (should have limited access)
  const isPlatformUser = useMemo(() => {
    const hasExternalId = !!user?.externalUserId;
    const hasPlatformId = !!user?.platformId;
    const isUserRole = user?.role === 'USER';
    const result = isUserRole && (hasExternalId || hasPlatformId);
    console.log('🔍 Platform User Check:', {
      user,
      hasExternalId,
      hasPlatformId,
      isUserRole,
      isPlatformUser: result
    });
    return result;
  }, [user]);

  console.log(isPlatformUser ? '👤 Platform user detected - hiding controls' : '👤 Regular user - showing all controls');

  // ✅ Get room details from rooms (memoized)
  const currentRoom = useMemo(() => {
    if (!activeRoomId) return null;
    const roomsArray = Array.isArray(rooms)
      ? rooms
      : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];
    return roomsArray.find((r) => r && r._id === activeRoomId);
  }, [activeRoomId, rooms]);

  // ✅ Memoize messages to prevent re-renders
  const messages = useMemo(() => messagesByRoom[activeRoomId] || [], [messagesByRoom, activeRoomId]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => {
        const text = msg.text || msg.content || '';
        return text.toLowerCase().includes(query);
      })
      .reverse(); // Reverse to show newest first

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, messages]);

  // Scroll to current search result
  useEffect(() => {
    if (searchResults.length > 0 && currentSearchIndex >= 0) {
      const result = searchResults[currentSearchIndex];
      const element = document.getElementById(`msg-${result.msg._id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentSearchIndex, searchResults]);

  const handleSearchNext = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    }
  };

  const handleSearchPrev = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  };

  // ✅ Auto-scroll to bottom (which is top in reverse layout)
  const scrollToBottom = useCallback((force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (force) {
      // In reverse layout, "bottom" is scrollTop = 0
      container.scrollTop = 0;
      return;
    }

    // Check if user is near the "bottom" (scrollTop near 0 in reverse layout)
    const isNearBottom = container.scrollTop < 150;
    if (isNearBottom) {
      container.scrollTop = 0;
    }
  }, []);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && previousMessagesLength.current === 0) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [messages.length, scrollToBottom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > previousMessagesLength.current && previousMessagesLength.current > 0) {
      const lastMessage = messages[messages.length - 1];
      const isMyMessage = lastMessage?.senderId === user?._id;

      if (isMyMessage) {
        scrollToBottom(true);
      } else {
        scrollToBottom(false);
      }
    }
    previousMessagesLength.current = messages.length;
  }, [messages, scrollToBottom, user?._id]);

  // ✅ Get other participant or all participants for display
  const otherParticipant = useMemo(() => {
    if (!roomDetails || !roomDetails.participants) return null;
    const other = roomDetails.participants.find(
      (p) => p.userId && p.userId._id !== user?._id
    )?.userId;
    return other;
  }, [roomDetails, user]);

  // Get display name for header - show contact name or phone number
  const displayName = useMemo(() => {
    console.log('🔍 DisplayName Debug:', { readOnly, roomDetails, otherParticipant });

    // For read-only mode (admin monitoring), show all participants
    if (readOnly && roomDetails?.participants) {
      console.log('📋 Participants:', roomDetails.participants);
      const participantNames = roomDetails.participants
        .map(p => p.userId?.name || p.name)
        .filter(Boolean)
        .join(' & ');
      console.log('✅ Participant Names:', participantNames);
      if (participantNames) return participantNames;
    }

    // For regular chat, use room name from backend (which includes contact name logic)
    if (currentRoom?.name) return currentRoom.name;
    if (roomDetails?.name) return roomDetails.name;
    if (otherParticipant) return otherParticipant.name;

    // Fallback to otherParticipants array
    if (roomDetails?.otherParticipants && roomDetails.otherParticipants.length > 0) {
      const names = roomDetails.otherParticipants
        .map(p => p.name)
        .filter(Boolean)
        .join(' & ');
      if (names) return names;
    }

    return 'Loading...';
  }, [otherParticipant, roomDetails, readOnly, currentRoom]);

  // Get display phone for subtitle
  const displayPhone = useMemo(() => {
    if (readOnly) return null;
    return currentRoom?.displayPhone || roomDetails?.displayPhone || otherParticipant?.phone || null;
  }, [roomDetails, otherParticipant, readOnly, currentRoom]);

  const isOtherUserOnline = useMemo(() => {
    if (!otherParticipant?._id || !Array.isArray(onlineUsers)) return false;

    const otherId = otherParticipant._id.toString();
    const isOnline = onlineUsers.some(id => id.toString() === otherId);

    console.log('🔍 Online Check:', {
      otherParticipantId: otherId,
      onlineUsersCount: onlineUsers.length,
      isOnline
    });

    return isOnline;
  }, [otherParticipant, onlineUsers]);

  // ✅ Update room details only when room changes
  useEffect(() => {
    console.log('🔄 Room Update:', { readOnly, currentRoom });
    if (currentRoom) {
      console.log('✅ Using currentRoom:', currentRoom);
      setRoomDetails(currentRoom);
    }
  }, [currentRoom, readOnly]);

  // ✅ Join room and fetch messages ONLY when activeRoomId changes
  useEffect(() => {
    if (!activeRoomId) {
      hasJoinedRoom.current = false;
      setMessagesLoaded(false);
      setRoomDetails(null);
      return;
    }

    // Prevent duplicate joins - CRITICAL: Check if already joined this specific room
    if (hasJoinedRoom.current === activeRoomId) {
      console.log(`⏭️ Already joined room ${activeRoomId}, skipping`);
      return;
    }

    hasJoinedRoom.current = activeRoomId;
    console.log(`📍 ChatWindow: Joining room ${activeRoomId}`);

    let isMounted = true;

    const loadRoom = async () => {
      try {
        setMessagesLoaded(false);

        // Only join room via socket if user is authenticated AND socket is connected
        if (user && chatSocketClient && chatSocketClient.isReady()) {
          joinRoom(activeRoomId, readOnly);
        } else {
          console.log('⏭️ [ChatWindow] Skipping socket join - no user or socket not connected');
        }

        // For unauthenticated users accessing a specific room, redirect to platform auth
        if (!user && activeRoomId) {
          console.log('🔐 [ChatWindow] Unauthenticated user trying to access room, redirecting to platform auth');
          // Check if this looks like a platform integration URL
          const urlParams = new URLSearchParams(window.location.search);
          const hasApiKey = urlParams.get('apiKey') || urlParams.get('key');
          const hasUserData = urlParams.get('name') && urlParams.get('email') && urlParams.get('phone');

          if (hasApiKey || hasUserData) {
            // This looks like a platform integration, let the platform detection handle it
            console.log('🔄 [ChatWindow] Platform integration detected, waiting for authentication...');
          } else {
            // No platform data, redirect to login
            console.log('🔄 [ChatWindow] No platform data, redirecting to login');
            window.location.href = '/login';
          }

          if (isMounted) {
            setMessagesLoaded(true);
          }
          return;
        }

        const result = await dispatch(fetchMessages({
          roomId: activeRoomId,
          page: 1,
          limit: 50
        })).unwrap();

        if (isMounted) {
          setMessagesLoaded(true);
        }
      } catch (error) {
        console.error(`❌ Failed to load room:`, error);
        if (isMounted) {
          setMessagesLoaded(true);
        }
      }
    };

    loadRoom();

    return () => {
      isMounted = false;
      console.log(`🚪 Leaving room: ${activeRoomId}`);
      if (user && chatSocketClient && chatSocketClient.isReady()) {
        leaveRoom(activeRoomId);
      }
      // Don't reset hasJoinedRoom here to prevent re-joining
    };
  }, [activeRoomId, dispatch, readOnly]);

  // ✅ Track when messages become visible and mark as read only then
  useEffect(() => {
    if (!activeRoomId || readOnly) return;
    // IntersectionObserver not supported on older iOS — guard it
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: just mark all messages as read after a delay
      const timer = setTimeout(() => {
        if (!document.hidden && activeRoomId) {
          const unreadIds = messages
            .filter(m => m.status !== 'read' && m.senderId !== user?._id)
            .map(m => m._id)
            .filter(Boolean);
          if (unreadIds.length > 0) markMessagesAsRead(activeRoomId, unreadIds);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }

    let observer;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          const visibleMessageIds = [];
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              const messageId = entry.target.getAttribute('data-message-id');
              const messageStatus = entry.target.getAttribute('data-message-status');
              const messageSenderId = entry.target.getAttribute('data-message-sender');
              if (messageId && messageStatus !== 'read' && messageSenderId !== user?._id) {
                visibleMessageIds.push(messageId);
              }
            }
          });
          if (visibleMessageIds.length > 0) {
            setTimeout(() => {
              if (!document.hidden && activeRoomId) {
                markMessagesAsRead(activeRoomId, visibleMessageIds);
              }
            }, 1500);
          }
        },
        { threshold: 0.5, rootMargin: '0px 0px -50px 0px' }
      );
      const messageElements = document.querySelectorAll('[data-message-id]');
      messageElements.forEach(el => observer.observe(el));
    } catch (e) {
      console.warn('[ChatWindow] IntersectionObserver failed:', e);
    }

    return () => { try { observer?.disconnect(); } catch(e) {} };
  }, [activeRoomId, readOnly, user?._id, markMessagesAsRead, messages]);

  // ✅ Listen for real-time message status updates
  useEffect(() => {
    const handleMessageStatusUpdate = (event) => {
      const { roomId, messageId, status } = event.detail;
      if (roomId === activeRoomId) {
        console.log(`🔄 [ChatWindow] Real-time status update: ${messageId} -> ${status}`);
        // Force a re-render by updating a timestamp
        setMessagesLoaded(prev => !prev ? true : prev);
      }
    };

    const handleMessagesReadUpdate = (event) => {
      const { roomId, messageIds } = event.detail;
      if (roomId === activeRoomId) {
        console.log(`👁️ [ChatWindow] Real-time read update: ${messageIds.length} messages marked as read`);
        // Force a re-render
        setMessagesLoaded(prev => !prev ? true : prev);
      }
    };

    window.addEventListener('message_status_updated', handleMessageStatusUpdate);
    window.addEventListener('messages_read_updated', handleMessagesReadUpdate);

    return () => {
      window.removeEventListener('message_status_updated', handleMessageStatusUpdate);
      window.removeEventListener('messages_read_updated', handleMessagesReadUpdate);
    };
  }, [activeRoomId]);

  // Handle incoming calls
  useEffect(() => {
    const handleIncomingCall = ({ callerId, callerName, callType, roomId }) => {
      if (roomId === activeRoomId) {
        // Call hook handles incoming call state
      }
    };
    try {
      chatSocketClient.on('call_incoming', handleIncomingCall);
    } catch(e) {}
    return () => {
      try { chatSocketClient.offAll('call_incoming'); } catch(e) {}
    };
  }, [activeRoomId]);

  const handleStartCall = () => {
    if (!otherParticipant) {
      message.error('Cannot start call: No participant found');
      return;
    }
    if (!isOtherUserOnline) {
      message.warning('User is offline');
      return;
    }
    initiateCall(otherParticipant, activeRoomId, displayName, displayPhone);
  };

  // ✅ Show empty state if no room selected
  if (!activeRoomId) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: theme?.secondaryColor || '#F0F2F5',
          flexDirection: 'column',
          gap: '20px',
          padding: '40px',
        }}
      >
        <div
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: theme?.primaryColor || '#008069',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(0, 128, 105, 0.3)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <MessageOutlined style={{ fontSize: '80px', color: '#FFFFFF' }} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111B21', marginBottom: '12px' }}>
            WhatsApp Web
          </h2>
          <p style={{ fontSize: '14px', color: '#667781', lineHeight: '1.6' }}>
            Select a chat from the list to start messaging or click the + button to start a new conversation
          </p>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  // ✅ Show loading state only when actively loading
  const isLoading = loadingMessages[activeRoomId] || (!messagesLoaded && messages.length === 0);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: theme?.backgroundColor || '#f5f5f5',
        }}
      >
        <Spin size="large" tip="Loading messages..." />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme?.backgroundColor || '#ffffff',
      }}
    >
      {/* Header - WhatsApp Style - Fixed */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: showMobileHeader ? '10px 16px' : '12px 20px',
          borderBottom: `1px solid ${theme?.sidebarBorderColor || '#e0e0e0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme?.headerBackgroundColor || '#008069',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          {/* Hide back button for platform users */}
          {showMobileHeader && !isPlatformUser && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined style={{ fontSize: '20px' }} />}
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  dispatch(setActiveRoom(''));
                }
              }}
              style={{ color: theme?.headerTextColor || '#FFFFFF', padding: '4px' }}
            />
          )}

          {otherParticipant ? (
            <>
              <div
                style={{ position: 'relative', flexShrink: 0, cursor: isPlatformUser ? 'default' : 'pointer' }}
                // onClick={() => !isPlatformUser && navigate(`/profile/${otherParticipant._id}`)}
              >
                <Avatar src={otherParticipant.avatar} size={40} name={displayName} />
                {isOtherUserOnline && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: theme?.accentColor || '#25D366',
                      border: '2px solid #FFFFFF',
                    }}
                  />
                )}
              </div>
              <div
                style={{ flex: 1, minWidth: 0, cursor: isPlatformUser ? 'default' : 'pointer' }}
                // onClick={() => !isPlatformUser && navigate(`/profile/${otherParticipant._id}`)}
              >
                <div style={{ fontWeight: 600, color: theme?.headerTextColor || '#FFFFFF', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '12px', color: theme?.headerIconColor || 'rgba(255,255,255,0.8)' }}>
                  {displayPhone || (isOtherUserOnline ? 'online' : 'offline')}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar size={40} name={displayName} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: theme?.headerTextColor || '#FFFFFF', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
              </div>
            </>
          )}
        </div>

        <Space size="small">
          <Tooltip title="Search">
            <Button
              type="text"
              icon={<SearchOutlined style={{ fontSize: '18px' }} />}
              onClick={() => setSearchOpen(!searchOpen)}
              style={{ color: theme?.headerIconColor || '#FFFFFF' }}
            />
          </Tooltip>
          {/* Hide call and more buttons for platform users */}
          {/* {!isPlatformUser && (
            <>
              <Tooltip title={callState.isInCall ? "Call in progress" : "Audio Call"}>
                <Button
                  type="text"
                  icon={<PhoneOutlined style={{ fontSize: '18px' }} />}
                  onClick={handleStartCall}
                  disabled={!isOtherUserOnline || readOnly || callState.isInCall}
                  style={{ color: callState.isInCall ? 'rgba(255,255,255,0.5)' : (theme?.headerIconColor || '#FFFFFF') }}
                />
              </Tooltip>
              <Tooltip title="More">
                <Button 
                  type="text" 
                  icon={<MoreOutlined style={{ fontSize: '18px' }} />}
                  style={{ color: theme?.headerIconColor || '#FFFFFF' }}
                />
              </Tooltip>
            </>
          )} */}
        </Space>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div
          style={{
            padding: '8px 16px',
            background: theme?.headerBackgroundColor || '#008069',
            borderBottom: `1px solid ${theme?.sidebarBorderColor || '#e0e0e0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{ flex: 1 }}
            suffix={
              searchResults.length > 0 && (
                <span style={{ fontSize: '12px', color: '#667781', marginRight: '8px' }}>
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
              )
            }
          />
          <Button
            type="text"
            size="small"
            icon={<UpOutlined />}
            onClick={handleSearchPrev}
            disabled={searchResults.length === 0}
            style={{ color: '#FFFFFF' }}
          />
          <Button
            type="text"
            size="small"
            icon={<DownOutlined />}
            onClick={handleSearchNext}
            disabled={searchResults.length === 0}
            style={{ color: '#FFFFFF' }}
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleCloseSearch}
            style={{ color: '#FFFFFF' }}
          />
        </div>
      )}

      {/* Messages - WhatsApp Background - Scrollable */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column-reverse', // This makes messages start from bottom
          background: theme?.chatBackgroundImage
            ? `url(${theme.chatBackgroundImage}) center/cover no-repeat`
            : `url(${whatsappBg}) center/cover no-repeat, ${theme?.chatBackgroundColor || '#E5DDD5'}`,
        }}
      >
        {/* Auto-scroll anchor at top for reverse layout */}
        <div ref={messagesEndRef} />
        <MessageList
          messages={messages}
          roomId={activeRoomId}
          searchQuery={searchQuery}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
        />
      </div>

      {/* Typing Indicator - Fixed */}
      <div style={{ flexShrink: 0 }}>
        <TypingIndicator />
      </div>

      {/* Input - Fixed Bottom */}
      {!readOnly && (
        <div style={{ flexShrink: 0, background: theme?.inputBackgroundColor || '#F0F0F0' }}>
          <MessageInput roomId={activeRoomId} />
        </div>
      )}
    </div>
  );
}
