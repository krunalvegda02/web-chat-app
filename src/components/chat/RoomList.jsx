import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState, useCallback } from 'react';
import {
  fetchRooms,
  setActiveRoom,
  fetchAdminChatRooms,
} from '../../redux/slices/chatSlice';
import { Input, List, Badge, Empty, Button, Space, Spin } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import Avatar from '../common/Avatar';
import OnlineStatus from './OnlineStatus';
import { format, isToday, isYesterday } from 'date-fns';
import { chatSocketClient } from '../../sockets/chatSocketClient';

export default function RoomList({ fetchRoomsAction = null, onCreateRoom = null }) {
  const dispatch = useDispatch();
  const { rooms, activeRoomId, loadingRooms } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Fetch rooms on mount
  useEffect(() => {
    if (fetchRoomsAction) {
      dispatch(fetchRoomsAction());
    } else if (user?.role === 'ADMIN') {
      dispatch(fetchAdminChatRooms());
    } else if (user?.tenantId) {
      dispatch(fetchRooms(user.tenantId));
    }
  }, [dispatch, user?.tenantId, user?.role, fetchRoomsAction]);

  // ✅ Listen for room updates from socket (room_updated only, message_received handled globally)
  useEffect(() => {
    const handleRoomUpdate = () => {
      // Refetch rooms when room is updated
      if (fetchRoomsAction) {
        dispatch(fetchRoomsAction());
      } else if (user?.role === 'ADMIN') {
        dispatch(fetchAdminChatRooms());
      } else if (user?.tenantId) {
        dispatch(fetchRooms(user.tenantId));
      }
    };

    chatSocketClient.on('room_updated', handleRoomUpdate);

    return () => {
      chatSocketClient.off('room_updated', handleRoomUpdate);
    };
  }, [dispatch, user, fetchRoomsAction]);

  // Get rooms array
  const roomsArray = Array.isArray(rooms)
    ? rooms
    : rooms?.data?.rooms ||
      rooms?.rooms ||
      rooms?.data ||
      [];

  // Filter rooms
  const filteredRooms = roomsArray.filter((room) =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.participants?.some((p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Get room display name
  const getRoomDisplayName = useCallback((room) => {
    if (room.type === 'ADMIN_CHAT') {
      const otherParticipant = room.participants?.find(
        (p) => p.userId?._id !== user?._id
      );
      return otherParticipant?.userId?.name || room.name || 'Admin Chat';
    }
    return room.name || 'Unnamed Room';
  }, [user?._id]);

  // Get last message text
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

  // Format time
  const formatMessageTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  }, []);

  // Get unread count
  const getUnreadCount = useCallback((room) => {
    return room.unreadCount || 0;
  }, []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <Space>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (fetchRoomsAction) dispatch(fetchRoomsAction());
                  else if (user?.role === 'ADMIN')
                    dispatch(fetchAdminChatRooms());
                  else if (user?.tenantId) dispatch(fetchRooms(user.tenantId));
                }}
                loading={loadingRooms}
              />
              {onCreateRoom && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onCreateRoom}
                  size="small"
                />
              )}
            </Space>
          </div>

          {/* Search */}
          <Input
            placeholder="Search conversations..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg"
            size="large"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {loadingRooms && !roomsArray.length ? (
          <div className="flex items-center justify-center h-full">
            <Spin tip="Loading rooms..." />
          </div>
        ) : filteredRooms.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={searchTerm ? 'No rooms found' : 'No conversations yet'}
          >
            {onCreateRoom && !searchTerm && (
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={onCreateRoom}
              >
                Start a Conversation
              </Button>
            )}
          </Empty>
        ) : (
          <List
            dataSource={filteredRooms}
            renderItem={(room) => (
              <List.Item
                key={room._id}
                onClick={() => dispatch(setActiveRoom(room._id))}
                className={`!px-4 !py-3 cursor-pointer transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 ${
                  activeRoomId === room._id
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : ''
                }`}
              >
                <List.Item.Meta
                  avatar={
                    <div className="relative">
                      <Avatar
                        name={getRoomDisplayName(room)}
                        size={44}
                        src={room.avatar}
                      />
                      {/* Online Status Badge */}
                      {room.type === 'ADMIN_CHAT' && (
                        <div className="absolute bottom-0 right-0">
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
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">
                        {getRoomDisplayName(room)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(room.lastMessageTime)}
                      </span>
                    </div>
                  }
                  description={
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 truncate flex-1">
                        {getLastMessageText(room.lastMessage)}
                      </span>
                      {getUnreadCount(room) > 0 && (
                        <Badge
                          count={getUnreadCount(room)}
                          className="ml-2"
                          style={{
                            backgroundColor: '#1890ff',
                            fontSize: '10px',
                            minWidth: '20px',
                          }}
                        />
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
