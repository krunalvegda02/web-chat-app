import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  joinRoomThunk,
  setActiveRoom,
} from '../../redux/slices/chatSlice';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Spin, Empty, Button } from 'antd';
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
  const { activeRoomId, messagesByRoom, loadingMessages, rooms, onlineUsers } = useSelector(
    (s) => s.chat
  );
  const { user } = useSelector((s) => s.auth);
  const [roomDetails, setRoomDetails] = useState(null);

  useEffect(() => {
    if (activeRoomId) {
      console.log(`📍 ChatWindow: Active room changed to ${activeRoomId}`);
      dispatch(joinRoomThunk(activeRoomId));
      dispatch(fetchMessages({ roomId: activeRoomId, page: 1, limit: 50 }));

      const roomsArray = Array.isArray(rooms) ? rooms :
        rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];
      const room = roomsArray.find((r) => r._id === activeRoomId);
      setRoomDetails(room);
    }
  }, [activeRoomId, dispatch, rooms]);

  if (!activeRoomId) {
    return (
      <Empty
        description="Choose a chat from the list to begin messaging"
        style={{ marginTop: '50px' }}
      />
    );
  }

  const isLoading = loadingMessages[activeRoomId];
  const messages = messagesByRoom[activeRoomId] || [];
  const otherParticipant = roomDetails?.participants?.find(
    (p) => p.userId?._id !== user?._id
  )?.userId;

  const isOtherUserOnline = onlineUsers.includes(otherParticipant?._id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => dispatch(setActiveRoom(''))}
            />
          )}
          {otherParticipant && (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {otherParticipant.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: '500' }}>{otherParticipant.name}</div>
                <OnlineStatus
                  userId={otherParticipant._id}
                  isOnline={isOtherUserOnline}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="text" icon={<PhoneOutlined />} />
          <Button type="text" icon={<VideoCameraOutlined />} />
          <Button type="text" icon={<MoreOutlined />} />
        </div>
      </div>

      {/* Messages */}
      {isLoading ? (
        <Spin tip="Loading messages..." style={{ flex: 1 }} />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
          <MessageList messages={messages} />
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <MessageInput />
      </div>
    </div>
  );
}
