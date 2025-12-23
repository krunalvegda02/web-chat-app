import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState, useCallback } from 'react';
import { fetchRooms, setActiveRoom } from '../../redux/slices/chatSlice';
import { Input, List, Badge, Empty, Button, Spin } from 'antd';
import { SearchOutlined, PlusOutlined, MessageOutlined } from '@ant-design/icons';
import Avatar from '../common/Avatar';
import OnlineStatus from './OnlineStatus';
import { format, isToday, isYesterday } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';


export default function RoomList({ fetchRoomsAction = null, onCreateRoom = null, onRoomClick = null }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { rooms, activeRoomId, loadingRooms } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Fetch rooms on mount
  useEffect(() => {
    const fetchRoomsData = async () => {
      if (fetchRoomsAction) {
        const result = await dispatch(fetchRoomsAction());
        console.log('📥 [ROOMLIST] Fetched rooms result:', result?.payload?.data?.rooms?.map(r => ({
          id: r._id,
          name: r.name,
          unreadCount: r.unreadCount
        })));
      } else {
        const result = await dispatch(fetchRooms());
        console.log('📥 [ROOMLIST] Fetched rooms result:', result?.payload?.data?.rooms?.map(r => ({
          id: r._id,
          name: r.name,
          unreadCount: r.unreadCount
        })));
      }
    };
    fetchRoomsData();
  }, [dispatch, user?.role, fetchRoomsAction]);

  const roomsArray = Array.isArray(rooms)
    ? rooms
    : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];

  // Log rooms from Redux state
  useEffect(() => {
    console.log('📦 [ROOMLIST] Rooms from Redux state:', roomsArray.map(r => ({
      id: r._id,
      name: r.name,
      unreadCount: r.unreadCount
    })));
  }, [roomsArray]);

  // ✅ Filter rooms by search term
  const filteredRooms = roomsArray.filter((room) =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.participants?.some(
      (p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // ✅ Get room display name
  const getRoomDisplayName = useCallback((room) => {
    // For regular chats, always extract participant names from participants array
    const participants = room.participants || [];
    const otherParticipants = participants.filter(p => {
      const participantId = p.userId?._id || p._id;
      return participantId !== user?._id;
    });
    
    if (otherParticipants.length > 0) {
      const names = otherParticipants
        .map(p => p.userId?.name || p.name)
        .filter(Boolean);
      if (names.length > 0) {
        return names.join(', ');
      }
    }
    
    // Fallback to room name only if it doesn't contain 'Chat -' pattern
    if (room.name && !room.name.includes('Chat -')) {
      return room.name;
    }
    
    return 'Chat';
  }, [user?._id]);

  // ✅ Get participant avatar
  const getParticipantAvatar = useCallback((room) => {
    const participants = room.participants || [];
    const otherParticipant = participants.find(p => {
      const participantId = p.userId?._id || p._id;
      return participantId !== user?._id;
    });
    return otherParticipant?.userId?.avatar || otherParticipant?.avatar || room.avatar;
  }, [user?._id]);

  // ✅ Get last message text
  const getLastMessageText = useCallback((room) => {
    // Always show last message, not first unread
    const lastMessage = room.lastMessage;
    if (!lastMessage) return 'No messages yet';
    
    if (typeof lastMessage === 'object') {
      // Check for content first
      if (lastMessage.content) {
        return lastMessage.content.substring(0, 50);
      }
      // Check message type for media
      if (lastMessage.type === 'image') return '📷 Photo';
      if (lastMessage.type === 'video') return '🎥 Video';
      if (lastMessage.type === 'voice') return '🎤 Voice message';
      if (lastMessage.type === 'audio') return '🎵 Audio';
      if (lastMessage.type === 'file') return '📎 File';
      // Check if media array exists
      if (lastMessage.media && lastMessage.media.length > 0) {
        const mediaType = lastMessage.media[0].type;
        if (mediaType === 'image') return '📷 Photo';
        if (mediaType === 'video') return '🎥 Video';
        if (mediaType === 'audio' || mediaType === 'voice') return '🎤 Voice message';
        if (mediaType === 'file') return '📎 File';
      }
    }
    
    if (typeof lastMessage === 'string') {
      return lastMessage.substring(0, 50);
    }
    
    return 'No messages yet';
  }, []);

  // ✅ Format time
  const formatMessageTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  }, []);

  // ✅ Get unread count
  const getUnreadCount = useCallback((room) => {
    // console.log(" =============first rppm unread", room)
      // Backend sends unreadCount as a number directly
    const count = typeof room.unreadCount === 'number' ? room.unreadCount : 0;
    // console.log(`🔔 [ROOMLIST] Room ${room._id} unread count:`, count, 'raw:', room.unreadCount);
    return count;
  }, []);

  // ✅ Show loading state
  if (loadingRooms && roomsArray.length === 0) {
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
        <Spin tip="Loading rooms..." />
      </div>
    );
  }



  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme?.
          sidebarBackgroundColor || '#FFFFFF',
        borderRight: `1px solid ${theme?.borderColor || '#E5E7EB'}`,
      }}
    >
      {/* ===== HEADER - WhatsApp Style ===== */}
      <div
        style={{
          padding: '13px',
          background: theme?.sidebarHeaderColor || '#008069',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '500',
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            {theme?.appName || 'Chats'}
          </h2>
          {onCreateRoom && (
            <Button
              type="text"
              icon={<PlusOutlined style={{ fontSize: '20px', color: '#FFFFFF' }} />}
              onClick={onCreateRoom}
              size="large"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            />
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '12px', backgroundColor: theme?.sidebarBackgroundColor || '#FFFFFF', borderBottom: `1px solid ${theme?.sidebarBorderColor || '#E9EDEF'}` }}>
        <Input
          placeholder="Search or start new chat"
          prefix={<SearchOutlined style={{ color: theme?.headerText || '#667781' }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          style={{
            borderRadius: '8px',
            backgroundColor: theme?.inputBackgroundColor || '#F0F2F5',
            border: 'none',
          }}
          size="large"
        />
      </div>

      {/* ===== ROOM LIST - WhatsApp Style ===== */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: theme?.sidebarBackgroundColor || '#FFFFFF' }}>
        {filteredRooms.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: '20px',
              padding: '40px',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: theme?.primaryColor || '#008069',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${theme?.primaryColor || 'rgba(0, 128, 105, 0.25)'}`,
              }}
            >
              <MessageOutlined style={{ fontSize: '50px', color: '#FFFFFF' }} />
            </div>
            <div style={{ textAlign: 'center', maxWidth: '300px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme?.headerText || '#111B21', marginBottom: '8px' }}>
                {searchTerm ? 'No chats found' : 'No conversations yet'}
              </h3>
              <p style={{ fontSize: '13px', color: theme?.headerText || '#667781', lineHeight: '1.5', marginBottom: '16px' }}>
                {searchTerm ? 'Try searching with different keywords' : 'Start a new conversation by clicking the + button'}
              </p>
              {onCreateRoom && !searchTerm && (
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={onCreateRoom}
                  style={{
                    backgroundColor: theme?.primaryColor || '#008069',
                    borderColor: theme?.primaryColor || '#008069',
                    borderRadius: '8px',
                    height: '40px',
                    fontSize: '14px',
                  }}
                >
                  Start a Conversation
                </Button>
              )}
            </div>
          </div>
        ) : (
          
          <List
            dataSource={filteredRooms}
            renderItem={(room) => {
                    {console.log("room", room)}

              const isActive = activeRoomId === room._id;
              const unreadCount = getUnreadCount(room);

              return (
                <List.Item
                  key={`${room._id}-${room.lastMessageTime || ''}-${room.unreadCount || 0}`}
                  onClick={() => {
                    dispatch(setActiveRoom(room._id));
                    if (onRoomClick) onRoomClick(room._id);
                  }}
                  style={{
                    backgroundColor: isActive ? (theme?.sidebarActiveColor || '#F0F2F5') : (theme?.sidebarBackgroundColor || '#FFFFFF'),
                    borderBottom: `1px solid ${theme?.sidebarBorderColor || '#F0F2F5'}`,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = theme?.sidebarHoverColor || '#F5F6F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? (theme?.sidebarActiveColor || '#F0F2F5') : (theme?.sidebarBackgroundColor || '#FFFFFF');
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ position: 'relative' }}>
                        <Badge
                          count={unreadCount}
                          offset={[-10, 10]}
                          style={{
                            backgroundColor: theme?.unreadBadgeColor || '#25D366',
                            fontSize: '10px',
                            minWidth: '20px',
                          }}
                        >
                          <Avatar
                            name={getRoomDisplayName(room)}
                            size={44}
                            src={getParticipantAvatar(room)}
                          />
                        </Badge>

                        {/* ✅ Online Status Badge */}
                        {room.type === 'ADMIN_CHAT' && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                            }}
                          >
                            <OnlineStatus
                              userId={
                                room.participants?.find(
                                  (p) => p.userId?._id !== user?._id
                                )?.userId?._id
                              }
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    }
                    title={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: '500',
                            color: theme?.sidebarTextColor || '#111B21',
                            fontSize: '16px',
                          }}
                        >
                          {getRoomDisplayName(room)}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: theme?.timestampColor || '#667781',
                          }}
                        >
                          {formatMessageTime(room.lastMessageTime)}
                        </span>
                      </div>
                    }
                    description={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '14px',
                            color: unreadCount > 0 ? '#111B21' : '#667781',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: unreadCount > 0 ? 500 : 400,
                          }}
                        >
                          {getLastMessageText(room)}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}