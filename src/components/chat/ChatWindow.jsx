
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
import { Spin, Empty, Button, Avatar, Space, Tooltip, message } from 'antd';
import {
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import OnlineStatus from './OnlineStatus';
import TypingIndicator from './TypingIndicator';
import { useTheme } from '../../hooks/useTheme';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useCall } from '../../contexts/CallContext';
import { chatSocketClient } from '../../sockets/chatSocketClient';

export default function ChatWindow({ isMobile = false, showMobileHeader = false, onBack, readOnly = false }) {
  const dispatch = useDispatch();
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

  // ✅ Get other participant or all participants for display
  const otherParticipant = useMemo(() => {
    if (!roomDetails || !roomDetails.participants) return null;
    const other = roomDetails.participants.find(
      (p) => p.userId && p.userId._id !== user?._id
    )?.userId;
    return other;
  }, [roomDetails, user]);

  // Get display name for header - show all participants
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
    
    // For regular chat, show other participant
    if (otherParticipant) return otherParticipant.name;
    
    // Fallback to otherParticipants array
    if (roomDetails?.otherParticipants && roomDetails.otherParticipants.length > 0) {
      const names = roomDetails.otherParticipants
        .map(p => p.name)
        .filter(Boolean)
        .join(' & ');
      if (names) return names;
    }
    
    // Last resort: room name
    if (roomDetails?.name) return roomDetails.name;
    
    return 'Loading...';
  }, [otherParticipant, roomDetails, readOnly]);

  const isOtherUserOnline = useMemo(() => {
    console.log('🔍 Online Check:', { 
      otherParticipant, 
      otherParticipantId: otherParticipant?._id,
      onlineUsers,
      includes: otherParticipant && onlineUsers.includes(otherParticipant._id)
    });
    return otherParticipant && onlineUsers.includes(otherParticipant._id);
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

    // Prevent duplicate joins
    if (hasJoinedRoom.current) return;
    hasJoinedRoom.current = true;

    console.log(`📍 ChatWindow: Joining room ${activeRoomId}`);

    let isMounted = true;

    const loadRoom = async () => {
      try {
        setMessagesLoaded(false);
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
          setMessagesLoaded(true);
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
  }, [activeRoomId, dispatch]);

  // ❌ REMOVED: Auto-mark-as-read logic that was causing infinite loop
  // Messages are marked as read via socket events when user joins room
  // See: Backend chatSocket.js join_room event handler

  // Handle incoming calls
  useEffect(() => {
    const handleIncomingCall = ({ callerId, callerName, callType, roomId }) => {
      if (roomId === activeRoomId) {
        // Call hook handles incoming call state
      }
    };

    chatSocketClient.on('call_incoming', handleIncomingCall);

    return () => {
      chatSocketClient.offAll('call_incoming');
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
    initiateCall(otherParticipant, activeRoomId);
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
          background: '#F0F2F5',
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
            background: 'linear-gradient(135deg, #008069 0%, #00A884 100%)',
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
          borderBottom: `1px solid ${theme?.borderColor || '#e0e0e0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#008069',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          {showMobileHeader && (
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
              style={{ color: '#FFFFFF', padding: '4px' }}
            />
          )}

          {otherParticipant ? (
            <>
              <div style={{ position: 'relative', flexShrink: 0 }}>
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
                      backgroundColor: '#25D366',
                      border: '2px solid #FFFFFF',
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {otherParticipant.name}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  {isOtherUserOnline ? 'online' : 'offline'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar size={40} style={{ backgroundColor: '#00A884' }}>
                  {displayName?.[0]?.toUpperCase()}
                </Avatar>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
              </div>
            </>
          )}
        </div>

        <Space size="small">
          <Tooltip title={callState.isInCall ? "Call in progress" : "Audio Call"}>
            <Button
              type="text"
              icon={<PhoneOutlined style={{ fontSize: '18px' }} />}
              onClick={handleStartCall}
              disabled={!isOtherUserOnline || readOnly || callState.isInCall}
              style={{ color: callState.isInCall ? 'rgba(255,255,255,0.5)' : '#FFFFFF' }}
            />
          </Tooltip>
          <Tooltip title="More">
            <Button 
              type="text" 
              icon={<MoreOutlined style={{ fontSize: '18px' }} />}
              style={{ color: '#FFFFFF' }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Messages - WhatsApp Background - Scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column-reverse',
          background: '#E5DDD5',
        }}
      >
        <MessageList messages={messages} roomId={activeRoomId} />
      </div>

      {/* Typing Indicator - Fixed */}
      <div style={{ flexShrink: 0 }}>
        <TypingIndicator />
      </div>

      {/* Input - Fixed Bottom */}
      {!readOnly && (
        <div style={{ flexShrink: 0, background: '#F0F0F0' }}>
          <MessageInput roomId={activeRoomId} />
        </div>
      )}
    </div>
  );
}