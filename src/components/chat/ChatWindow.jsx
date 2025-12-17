import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  joinRoomThunk,
  setActiveRoom,
} from '../../redux/slices/chatSlice';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Spin, Empty, Avatar, Space, Button } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import OnlineStatus from './OnlineStatus';

export default function ChatWindow({ isMobile = false }) {
  const dispatch = useDispatch();
  const { activeRoomId, messagesByRoom, loadingMessages, rooms } = useSelector(
    (s) => s.chat
  );
  const { user } = useSelector((s) => s.auth);
  const [roomDetails, setRoomDetails] = useState(null);

  // ✅ Join room and fetch messages
  useEffect(() => {
    if (activeRoomId) {
      dispatch(joinRoomThunk(activeRoomId));
      dispatch(fetchMessages({ roomId: activeRoomId, page: 1, limit: 50 }));

      // Get room details
      const roomsArray = Array.isArray(rooms)
        ? rooms
        : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];
      const room = roomsArray.find((r) => r._id === activeRoomId);
      setRoomDetails(room);
    }
  }, [activeRoomId, dispatch, rooms]);

  if (!activeRoomId) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Select a conversation to start"
        >
          <p className="text-gray-500 text-sm">
            Choose a chat from the list to begin messaging
          </p>
        </Empty>
      </div>
    );
  }

  const messages = messagesByRoom[activeRoomId] || [];
  const isLoading = loadingMessages[activeRoomId];

  // Get other participant for ADMIN_CHAT
  const otherParticipant = roomDetails?.participants?.find(
    (p) => p.userId?._id !== user?._id
  )?.userId;

  // Get room name
  const getRoomName = () => {
    if (roomDetails?.type === 'ADMIN_CHAT') {
      return otherParticipant?.name || roomDetails?.name || 'Chat';
    }
    return roomDetails?.name || 'Unnamed Room';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isMobile && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => dispatch(setActiveRoom(''))}
              />
            )}

            <Avatar
              name={getRoomName()}
              size={40}
              src={roomDetails?.avatar}
            />

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">
                {getRoomName()}
              </h3>
              {otherParticipant && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <OnlineStatus userId={otherParticipant._id} size="xs" />
                  <span>
                    {otherParticipant.role === 'ADMIN' ? 'Admin' : 'User'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <Space>
            <Button type="text" icon={<PhoneOutlined />} />
            <Button type="text" icon={<VideoCameraOutlined />} />
            <Button type="text" icon={<MoreOutlined />} />
          </Space>
        </div>
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spin tip="Loading messages..." />
        </div>
      ) : (
        <>
          <MessageList messages={messages} />
          <MessageInput />
        </>
      )}
    </div>
  );
}
