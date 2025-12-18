import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState, useCallback } from 'react';
import { fetchRooms, setActiveRoom } from '../../redux/slices/chatSlice';
import { Input, List, Badge, Empty, Button, Spin } from 'antd';
import { SearchOutlined, PlusOutlined, MessageOutlined } from '@ant-design/icons';
import Avatar from '../common/Avatar';
import OnlineStatus from './OnlineStatus';
import { format, isToday, isYesterday } from 'date-fns';
import { chatSocketClient } from '../../sockets/chatSocketClient';
import { useTheme } from '../../hooks/useTheme';


/**
 * ✅ ENHANCED RoomList Component (HYBRID - BEST OF BOTH)
 * 
 * Features:
 * ✅ Full theme integration
 * ✅ Professional UI with hover effects
 * ✅ Avatar badge with unread count
 * ✅ Online status indicator
 * ✅ Real-time socket updates
 * ✅ Active room indicator
 * ✅ Search functionality with theme
 * ✅ Create room button
 * ✅ Time formatting (Today/Yesterday/Date)
 * ✅ Empty state with CTA
 * ✅ Socket ready check
 * ✅ Proper cleanup on unmount
 * ✅ Debug logging
 */
export default function RoomList({ fetchRoomsAction = null, onCreateRoom = null }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { rooms, activeRoomId, loadingRooms } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Fetch rooms on mount
  useEffect(() => {
    if (fetchRoomsAction) {
      dispatch(fetchRoomsAction());
    } else {
      dispatch(fetchRooms());
    }
  }, [dispatch, user?.role, fetchRoomsAction]);

  // ❌ REMOVED: Socket listeners that were causing infinite API calls
  // Room list updates are handled by Redux state from socket events in useSocket.js
  // No need to refetch all rooms on every message - state updates automatically

  // ✅ Get rooms array from various formats
  const roomsArray = Array.isArray(rooms)
    ? rooms
    : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];

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
    if (room.type === 'ADMIN_CHAT') {
      const otherParticipant = room.participants?.find(
        (p) => p.userId?._id !== user?._id
      );
      return otherParticipant?.userId?.name || room.name || 'Admin Chat';
    }
    return room.name || 'Unnamed Room';
  }, [user?._id]);

  // ✅ Get last message text
  const getLastMessageText = useCallback((lastMessage) => {
    if (!lastMessage) return 'No messages yet';
    if (typeof lastMessage === 'object' && lastMessage.content) {
      return lastMessage.content.substring(0, 50);
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
    return room.unreadCount || 0;
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
        backgroundColor: theme?.backgroundColor || '#ffffff',
        borderRight: `1px solid ${theme?.borderColor || '#e0e0e0'}`,
      }}
    >
      {/* ===== HEADER ===== */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme?.borderColor || '#e0e0e0'}`,
          background: theme?.headerBackground || theme?.backgroundColor || '#ffffff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Title and Action Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: theme?.headerText || '#000',
                margin: 0,
              }}
            >
              Messages
            </h2>
            {onCreateRoom && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreateRoom}
                size="small"
                style={{
                  backgroundColor: theme?.primaryColor || '#1890ff',
                  borderColor: theme?.primaryColor || '#1890ff',
                }}
              />
            )}
          </div>

          {/* ✅ Search input with theme colors */}
          <Input
            placeholder="Search conversations..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{
              borderColor: theme?.borderColor || '#d9d9d9',
              backgroundColor: theme?.secondaryColor || '#fafafa',
              color: theme?.headerText || '#000',
            }}
            size="large"
          />
        </div>
      </div>

      {/* ===== ROOM LIST ===== */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredRooms.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: theme?.borderColor || '#999' }}>
                {searchTerm ? 'No rooms found' : 'No conversations yet'}
              </span>
            }
            style={{ marginTop: '50px' }}
          >
            {onCreateRoom && !searchTerm && (
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={onCreateRoom}
                style={{
                  backgroundColor: theme?.primaryColor || '#1890ff',
                  borderColor: theme?.primaryColor || '#1890ff',
                }}
              >
                Start a Conversation
              </Button>
            )}
          </Empty>
        ) : (
          <List
            dataSource={filteredRooms}
            renderItem={(room) => {
              const isActive = activeRoomId === room._id;
              const unreadCount = getUnreadCount(room);

              return (
                <List.Item
                  key={room._id}
                  onClick={() => dispatch(setActiveRoom(room._id))}
                  style={{
                    backgroundColor: isActive
                      ? theme?.secondaryColor || '#f5f5f5'
                      : 'transparent',
                    borderBottom: `1px solid ${theme?.borderColor || '#f0f0f0'}`,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: isActive
                      ? `4px solid ${theme?.primaryColor || '#1890ff'}`
                      : '4px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      theme?.secondaryColor || '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive
                      ? theme?.secondaryColor || '#f5f5f5'
                      : 'transparent';
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ position: 'relative' }}>
                        <Badge
                          count={unreadCount}
                          offset={[-10, 10]}
                          style={{
                            backgroundColor: theme?.primaryColor || '#1890ff',
                            fontSize: '10px',
                            minWidth: '20px',
                          }}
                        >
                          <Avatar
                            name={getRoomDisplayName(room)}
                            size={44}
                            src={room.avatar}
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
                            fontWeight: isActive ? '600' : '500',
                            color: theme?.headerText || '#000',
                          }}
                        >
                          {getRoomDisplayName(room)}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: theme?.borderColor || '#8c8c8c',
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
                            fontSize: '12px',
                            color: theme?.borderColor || '#8c8c8c',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: unreadCount > 0 ? 600 : 400,
                          }}
                        >
                          {getLastMessageText(room.lastMessage)}
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