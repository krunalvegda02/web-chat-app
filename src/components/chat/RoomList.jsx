// import { useDispatch, useSelector } from 'react-redux';
// import { useEffect, useState, useCallback } from 'react';
// import {
//   fetchRooms,
//   setActiveRoom,
// } from '../../redux/slices/chatSlice';
// import { Input, List, Badge, Empty, Button, Spin } from 'antd';
// import {
//   SearchOutlined,
//   PlusOutlined,
//   MessageOutlined,
// } from '@ant-design/icons';
// import Avatar from '../common/Avatar';
// import OnlineStatus from './OnlineStatus';
// import { format, isToday, isYesterday } from 'date-fns';
// import { chatSocketClient } from '../../sockets/chatSocketClient';
// import { useTheme } from '../../hooks/useTheme';

// export default function RoomList({ fetchRoomsAction = null, onCreateRoom = null }) {
//   const dispatch = useDispatch();
//   const { theme } = useTheme();
//   const { rooms, activeRoomId, loadingRooms } = useSelector((s) => s.chat);
//   const { user } = useSelector((s) => s.auth);
//   const [searchTerm, setSearchTerm] = useState('');

// console.log(useSelector(state => state));

//   // ✅ Fetch rooms on mount
//   useEffect(() => {
//     if (fetchRoomsAction) {
//       dispatch(fetchRoomsAction());
//     } else {
//       dispatch(fetchRooms());
//     }
//   }, [dispatch, user?.role, fetchRoomsAction]);

//   // ✅ Listen for room updates from socket
//   useEffect(() => {
//     const handleRoomUpdate = () => {
//       // Refetch rooms when room is updated
//       if (fetchRoomsAction) {
//         dispatch(fetchRoomsAction());
//       } else {
//         dispatch(fetchRooms());
//       }
//     };

//     chatSocketClient.on('room_updated', handleRoomUpdate);

//     return () => {
//       chatSocketClient.off('room_updated', handleRoomUpdate);
//     };
//   }, [dispatch, fetchRoomsAction]);

//   // ✅ Get rooms array from various formats
//   const roomsArray = Array.isArray(rooms)
//     ? rooms
//     : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];

//   // ✅ Filter rooms by search term
//   const filteredRooms = roomsArray.filter((room) =>
//     room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     room.participants?.some(
//       (p) =>
//         p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
//     )
//   );

//   // ✅ Get room display name
//   const getRoomDisplayName = useCallback((room) => {
//     if (room.type === 'ADMIN_CHAT') {
//       const otherParticipant = room.participants?.find(
//         (p) => p.userId?._id !== user?._id
//       );
//       return otherParticipant?.userId?.name || room.name || 'Admin Chat';
//     }
//     return room.name || 'Unnamed Room';
//   }, [user?._id]);

//   // ✅ Get last message text
//   const getLastMessageText = useCallback((lastMessage) => {
//     if (!lastMessage) return 'No messages yet';
//     if (typeof lastMessage === 'object' && lastMessage.content) {
//       return lastMessage.content.substring(0, 50);
//     }
//     if (typeof lastMessage === 'string') {
//       return lastMessage.substring(0, 50);
//     }
//     return 'No messages yet';
//   }, []);

//   // ✅ Format time
//   const formatMessageTime = useCallback((timestamp) => {
//     if (!timestamp) return '';
//     const date = new Date(timestamp);
//     if (isToday(date)) return format(date, 'HH:mm');
//     if (isYesterday(date)) return 'Yesterday';
//     return format(date, 'MMM d');
//   }, []);

//   // ✅ Get unread count
//   const getUnreadCount = useCallback((room) => {
//     return room.unreadCount || 0;
//   }, []);



//   return (
//     <div
//       style={{
//         height: '100%',
//         display: 'flex',
//         flexDirection: 'column',
//         backgroundColor: theme.backgroundColor,
//         borderRight: `1px solid ${theme.borderColor}`,
//       }}
//     >
//       {/* ✅ Header with theme support */}
//       <div
//         style={{
//           padding: '12px 16px',
//           borderBottom: `1px solid ${theme.borderColor}`,
//           background: theme.headerBackground || theme.backgroundColor,
//         }}
//       >
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//           {/* Title and Action Buttons */}
//           <div
//             style={{
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//             }}
//           >
//             <h2
//               style={{
//                 fontSize: '18px',
//                 fontWeight: 'bold',
//                 color: theme.headerText,
//                 margin: 0,
//               }}
//             >
//               Messages
//             </h2>
//             {onCreateRoom && (
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={onCreateRoom}
//                 size="small"
//                 style={{
//                   backgroundColor: theme.primaryColor,
//                   borderColor: theme.primaryColor,
//                 }}
//               />
//             )}
//           </div>

//           {/* ✅ Search input with theme colors */}
//           <Input
//             placeholder="Search conversations..."
//             prefix={<SearchOutlined />}
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             style={{
//               borderColor: theme.borderColor,
//               backgroundColor: theme.secondaryColor,
//               color: theme.headerText,
//             }}
//             size="large"
//           />
//         </div>
//       </div>

//       {/* ✅ Room List */}
//       <div style={{ flex: 1, overflowY: 'auto' }}>
//         {loadingRooms && !roomsArray.length ? (
//           <div
//             style={{
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               height: '100%',
//             }}
//           >
//             <Spin tip="Loading rooms..." />
//           </div>
//         ) : filteredRooms.length === 0 ? (
//           <Empty
//             image={Empty.PRESENTED_IMAGE_SIMPLE}
//             description={
//               <span style={{ color: theme.borderColor }}>
//                 {searchTerm ? 'No rooms found' : 'No conversations yet'}
//               </span>
//             }
//             style={{ marginTop: '50px' }}
//           >
//             {onCreateRoom && !searchTerm && (
//               <Button
//                 type="primary"
//                 icon={<MessageOutlined />}
//                 onClick={onCreateRoom}
//                 style={{
//                   backgroundColor: theme.primaryColor,
//                   borderColor: theme.primaryColor,
//                 }}
//               >
//                 Start a Conversation
//               </Button>
//             )}
//           </Empty>
//         ) : (
//           <List
//             dataSource={filteredRooms}
//             renderItem={(room) => (
//               <List.Item
//                 key={room._id}
//                 onClick={() => dispatch(setActiveRoom(room._id))}
//                 style={{
//                   backgroundColor:
//                     activeRoomId === room._id
//                       ? theme.secondaryColor
//                       : 'transparent',
//                   borderBottom: `1px solid ${theme.borderColor}`,
//                   padding: '12px 16px',
//                   cursor: 'pointer',
//                   transition: 'all 0.2s ease',
//                   borderLeft:
//                     activeRoomId === room._id
//                       ? `4px solid ${theme.primaryColor}`
//                       : '4px solid transparent',
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.backgroundColor = theme.secondaryColor;
//                 }}
//                 onMouseLeave={(e) => {
//                   if (activeRoomId !== room._id) {
//                     e.currentTarget.style.backgroundColor = 'transparent';
//                   }
//                 }}
//               >
//                 <List.Item.Meta
//                   avatar={
//                     <div style={{ position: 'relative' }}>
//                       <Badge
//                         count={getUnreadCount(room)}
//                         offset={[-10, 10]}
//                         style={{
//                           backgroundColor: theme.primaryColor,
//                           fontSize: '10px',
//                           minWidth: '20px',
//                         }}
//                       >
//                         <Avatar
//                           name={getRoomDisplayName(room)}
//                           size={44}
//                           src={room.avatar}
//                         />
//                       </Badge>

//                       {/* ✅ Online Status Badge */}
//                       {room.type === 'ADMIN_CHAT' && (
//                         <div
//                           style={{
//                             position: 'absolute',
//                             bottom: 0,
//                             right: 0,
//                           }}
//                         >
//                           <OnlineStatus
//                             userId={
//                               room.participants?.find(
//                                 (p) => p.userId?._id !== user?._id
//                               )?.userId?._id
//                             }
//                             size="sm"
//                           />
//                         </div>
//                       )}
//                     </div>
//                   }
//                   title={
//                     <div
//                       style={{
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                       }}
//                     >
//                       <span
//                         style={{
//                           fontWeight:
//                             activeRoomId === room._id ? '600' : '500',
//                           color: theme.headerText,
//                         }}
//                       >
//                         {getRoomDisplayName(room)}
//                       </span>
//                       <span
//                         style={{
//                           fontSize: '12px',
//                           color: theme.borderColor,
//                         }}
//                       >
//                         {formatMessageTime(room.lastMessageTime)}
//                       </span>
//                     </div>
//                   }
//                   description={
//                     <div
//                       style={{
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                       }}
//                     >
//                       <span
//                         style={{
//                           fontSize: '12px',
//                           color: theme.borderColor,
//                           flex: 1,
//                           overflow: 'hidden',
//                           textOverflow: 'ellipsis',
//                           whiteSpace: 'nowrap',
//                         }}
//                       >
//                         {getLastMessageText(room.lastMessage)}
//                       </span>
//                     </div>
//                   }
//                 />
//               </List.Item>
//             )}
//           />
//         )}
//       </div>
//     </div>
//   );
// }




















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

  // ✅ FIX: Listen for real-time room updates
  useEffect(() => {
    if (!chatSocketClient.isReady()) {
      console.log('⏳ Socket not ready, skipping room update listeners');
      return;
    }

    const handleRoomUpdate = () => {
      console.log('🔄 [ROOMLIST] Room updated from socket');
      if (fetchRoomsAction) {
        dispatch(fetchRoomsAction());
      } else {
        dispatch(fetchRooms());
      }
    };

    const handleMessageReceived = (data) => {
      console.log('💬 [ROOMLIST] Message received, updating list');
      if (fetchRoomsAction) {
        dispatch(fetchRoomsAction());
      } else {
        dispatch(fetchRooms());
      }
    };

    // Attach listeners
    chatSocketClient.on('room_updated', handleRoomUpdate);
    chatSocketClient.on('message_received', handleMessageReceived);

    // Cleanup
    return () => {
      chatSocketClient.off('room_updated', handleRoomUpdate);
      chatSocketClient.off('message_received', handleMessageReceived);
    };
  }, [dispatch, fetchRoomsAction]);

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

  if (loadingRooms && roomsArray.length === 0) {
    return <Spin size="large" />;
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
      {/* Search Header */}
      <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
        <Input
          placeholder="Search chats..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          style={{ borderRadius: '20px' }}
        />
        {onCreateRoom && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            style={{ marginTop: '8px' }}
            onClick={onCreateRoom}
          >
            New Chat
          </Button>
        )}
      </div>

      {/* Rooms List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredRooms.length === 0 ? (
          <Empty description="No chats yet" style={{ marginTop: '50px' }} />
        ) : (
          <List
            dataSource={filteredRooms}
            renderItem={(room) => (
              <List.Item
                key={room._id}
                onClick={() => dispatch(setActiveRoom(room._id))}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background:
                    activeRoomId === room._id ? '#f5f5f5' : 'transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#fafafa')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    activeRoomId === room._id ? '#f5f5f5' : 'transparent')
                }
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot color="#52c41a" offset={[-5, 5]}>
                      <Avatar
                        src={
                          room.participants?.[0]?.userId?.avatar ||
                          room.participants?.[0]?.avatar
                        }
                        size={48}
                      >
                        {getRoomDisplayName(room)?.[0]?.toUpperCase()}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {getRoomDisplayName(room)}
                      </span>
                      {getUnreadCount(room) > 0 && (
                        <Badge
                          count={getUnreadCount(room)}
                          style={{
                            backgroundColor: '#ff4d4f',
                            color: '#fff',
                          }}
                        />
                      )}
                    </div>
                  }
                  description={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#8c8c8c',
                      }}
                    >
                      <span>{getLastMessageText(room.lastMessage)}</span>
                      <span>{formatMessageTime(room.lastMessageTime)}</span>
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