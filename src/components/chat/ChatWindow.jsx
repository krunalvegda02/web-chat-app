
// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchMessages,
//   joinRoomThunk,
//   setActiveRoom,
// } from '../../redux/slices/chatSlice';
// import MessageList from './MessageList';
// import MessageInput from './MessageInput';
// import { Spin, Empty, Button, Avatar, Space, Tooltip } from 'antd';
// import {
//   PhoneOutlined,
//   VideoCameraOutlined,
//   MoreOutlined,
//   ArrowLeftOutlined,
// } from '@ant-design/icons';
// import OnlineStatus from './OnlineStatus';
// import { useTheme } from '../../hooks/useTheme';

// /**
//  * ✅ OPTIMAL ChatWindow Component
//  * Combines:
//  * - Full Redux chat logic
//  * - Complete theming support
//  * - Mobile responsiveness
//  * - Online status indicator
//  * - Professional UI
//  */
// export default function ChatWindow({ isMobile = false }) {
//   const dispatch = useDispatch();
//   const { theme } = useTheme();
//   const { activeRoomId, messagesByRoom, loadingMessages, rooms, onlineUsers } = useSelector(
//     (s) => s.chat
//   );
//   const { user } = useSelector((s) => s.auth);
//   const [roomDetails, setRoomDetails] = useState(null);

//   // ✅ Join room and fetch messages
//   useEffect(() => {
//     if (activeRoomId) {
//       console.log(`📍 ChatWindow: Active room changed to ${activeRoomId}`);
//       dispatch(joinRoomThunk(activeRoomId));
//       dispatch(fetchMessages({ roomId: activeRoomId, page: 1, limit: 50 }));

//       const roomsArray = Array.isArray(rooms)
//         ? rooms
//         : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];
//       const room = roomsArray.find((r) => r._id === activeRoomId);
//       setRoomDetails(room);
//     }
//   }, [activeRoomId, dispatch, rooms]);

//   // ✅ Show empty state if no room selected
//   if (!activeRoomId) {
//     return (
//       <div
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           height: '100%',
//           backgroundColor: theme.backgroundColor,
//           color: theme.borderColor,
//         }}
//       >
//         <Empty
//           description="Choose a chat from the list to begin messaging"
//           style={{ marginTop: '50px', color: theme.borderColor }}
//         />
//       </div>
//     );
//   }

//   const isLoading = loadingMessages[activeRoomId];
//   const messages = messagesByRoom[activeRoomId] || [];
//   const otherParticipant = roomDetails?.participants?.find(
//     (p) => p.userId?._id !== user?._id
//   )?.userId;

//   const isOtherUserOnline = onlineUsers.includes(otherParticipant?._id);

//   return (
//     <div
//       style={{
//         display: 'flex',
//         flexDirection: 'column',
//         height: '100%',
//         backgroundColor: theme.backgroundColor,
//         backgroundImage: theme.chatBackgroundImage
//           ? `url(${theme.chatBackgroundImage})`
//           : 'none',
//         backgroundSize: 'cover',
//         backgroundPosition: 'center',
//       }}
//     >
//       {/* ===== HEADER ===== */}
//       <div
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: '12px 16px',
//           borderBottom: `1px solid ${theme.borderColor}`,
//           backgroundColor: theme.headerBackground,
//         }}
//       >
//         {/* Left: Back Button + Participant Info */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//           {isMobile && (
//             <Button
//               type="text"
//               icon={<ArrowLeftOutlined />}
//               onClick={() => dispatch(setActiveRoom(''))}
//               style={{ color: theme.primaryColor }}
//             />
//           )}

//           {/* Logo + App Name (if available) */}
//           {theme.logoUrl && (
//             <img
//               src={theme.logoUrl}
//               alt={theme.appName}
//               style={{
//                 height: `${theme.logoHeight || 40}px`,
//                 objectFit: 'contain',
//               }}
//             />
//           )}

//           {/* Participant Avatar */}
//           {otherParticipant && (
//             <>
//               <Avatar
//                 size="large"
//                 style={{
//                   backgroundColor: theme.accentColor,
//                   cursor: 'pointer',
//                 }}
//               >
//                 {otherParticipant.name?.[0]?.toUpperCase() || 'U'}
//               </Avatar>

//               {/* Participant Name + Status */}
//               <div>
//                 <div
//                   style={{
//                     fontWeight: '500',
//                     color: theme.headerText,
//                     fontSize: '16px',
//                   }}
//                 >
//                   {otherParticipant.name}
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                   <OnlineStatus
//                     isOnline={isOtherUserOnline}
//                     size="sm"
//                   />
//                   <span
//                     style={{
//                       fontSize: '12px',
//                       color: theme.borderColor,
//                     }}
//                   >
//                     {isOtherUserOnline ? 'Online' : 'Offline'}
//                   </span>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Right: Action Buttons */}
//         <Space>
//           <Tooltip title="Start Call">
//             <Button
//               type="text"
//               icon={<PhoneOutlined />}
//               style={{ color: theme.primaryColor }}
//             />
//           </Tooltip>
//           <Tooltip title="Start Video">
//             <Button
//               type="text"
//               icon={<VideoCameraOutlined />}
//               style={{ color: theme.primaryColor }}
//             />
//           </Tooltip>
//           <Tooltip title="More Options">
//             <Button
//               type="text"
//               icon={<MoreOutlined />}
//               style={{ color: theme.primaryColor }}
//             />
//           </Tooltip>
//         </Space>
//       </div>

//       {/* ===== MESSAGES AREA ===== */}
//       {isLoading ? (
//         <div
//           style={{
//             flex: 1,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             backgroundColor: theme.backgroundColor,
//           }}
//         >
//           <Spin tip="Loading messages..." />
//         </div>
//       ) : (
//         <div
//           style={{
//             flex: 1,
//             overflowY: 'auto',
//             backgroundColor: theme.backgroundColor,
//             backgroundImage: theme.chatBackgroundImage
//               ? `url(${theme.chatBackgroundImage})`
//               : 'none',
//             backgroundSize: 'cover',
//             backgroundPosition: 'center',
//             backgroundAttachment: 'fixed',
//           }}
//         >
//           {/* Overlay for background image */}
//           {theme.chatBackgroundImage && (
//             <div
//               style={{
//                 position: 'absolute',
//                 inset: 0,
//                 backgroundColor: `rgba(255, 255, 255, ${theme.blurEffect || 0.1})`,
//                 pointerEvents: 'none',
//               }}
//             />
//           )}

//           {/* Messages */}
//           <div style={{ position: 'relative', zIndex: 1 }}>
//             <MessageList messages={messages} />
//           </div>
//         </div>
//       )}

//       {/* ===== INPUT AREA ===== */}
//       <div
//         style={{
//           padding: '12px 16px',
//           borderTop: `1px solid ${theme.borderColor}`,
//           backgroundColor: theme.backgroundColor,
//         }}
//       >
//         <MessageInput />
//       </div>
//     </div>
//   );
// }












import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  joinRoomThunk,
  setActiveRoom,
} from '../../redux/slices/chatSlice';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Spin, Empty, Button, Avatar, Space, Tooltip } from 'antd';
import {
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import OnlineStatus from './OnlineStatus';
import TypingIndicator from './TypingIndicator';
import { useTheme } from '../../hooks/useTheme';
import { useChatSocket } from '../../hooks/useChatSocket';

export default function ChatWindow({ isMobile = false }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { joinRoom, leaveRoom, markMessagesAsRead } = useChatSocket();

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

  // ✅ Get other participant
  const otherParticipant = useMemo(() => {
    if (!roomDetails || !roomDetails.participants) return null;
    return roomDetails.participants.find(
      (p) => p.userId && p.userId._id !== user?._id
    )?.userId;
  }, [roomDetails, user]);

  const isOtherUserOnline = useMemo(
    () => otherParticipant && onlineUsers.includes(otherParticipant._id),
    [otherParticipant, onlineUsers]
  );

  // ✅ Update room details only when room changes
  useEffect(() => {
    if (currentRoom) {
      setRoomDetails(currentRoom);
    }
  }, [currentRoom]);

  // ✅ Join room and fetch messages ONLY when activeRoomId changes
  useEffect(() => {
    if (!activeRoomId) {
      hasJoinedRoom.current = false;
      return;
    }

    // Prevent duplicate joins
    if (hasJoinedRoom.current) return;
    hasJoinedRoom.current = true;

    console.log(`📍 ChatWindow: Joining room ${activeRoomId}`);

    let isMounted = true;

    const loadRoom = async () => {
      try {
        setMessagesLoaded(false); // Start loading
        joinRoom(activeRoomId);

        await dispatch(fetchMessages({
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
          setMessagesLoaded(true); // Still show UI even on error
        }
      }
    };

    loadRoom();

    return () => {
      isMounted = false;
      console.log(`🚪 Leaving room: ${activeRoomId}`);
      leaveRoom(activeRoomId);
      hasJoinedRoom.current = false;
    };
  }, [activeRoomId, dispatch]); // ✅ REMOVED joinRoom, leaveRoom - they're stable callbacks

  // ❌ REMOVED: Auto-mark-as-read logic that was causing infinite loop
  // Messages are marked as read via socket events when user joins room
  // See: Backend chatSocket.js join_room event handler

  // ✅ Show empty state if no room selected
  if (!activeRoomId) {
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
        <Empty description="Select a chat to start messaging" />
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
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${theme?.borderColor || '#e0e0e0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme?.headerBackground || '#fafafa',
        }}
      >
        <Space>
          {isMobile && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => dispatch(setActiveRoom(''))}
            />
          )}

          {otherParticipant ? (
            <>
              <div style={{ position: 'relative' }}>
                <Avatar src={otherParticipant.avatar} size={40}>
                  {otherParticipant.name?.[0]?.toUpperCase()}
                </Avatar>
                {isOtherUserOnline && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#52c41a',
                      border: '2px solid white',
                    }}
                  />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {otherParticipant.name}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  {isOtherUserOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 600 }}>{roomDetails?.name}</div>
          )}
        </Space>

        <Space>
          <Tooltip title="Call">
            <Button type="text" icon={<PhoneOutlined />} />
          </Tooltip>
          <Tooltip title="Video">
            <Button type="text" icon={<VideoCameraOutlined />} />
          </Tooltip>
          <Tooltip title="More">
            <Button type="text" icon={<MoreOutlined />} />
          </Tooltip>
        </Space>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column-reverse',
        }}
      >
        <MessageList messages={messages} roomId={activeRoomId} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator />

      {/* Input */}
      <MessageInput roomId={activeRoomId} />
    </div>
  );
}