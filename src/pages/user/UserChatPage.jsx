import { useTheme } from '../../hooks/useTheme';
import StandardChatLayout from '../../components/chat/StandardChatLayout';
import ChatWindow from '../../components/chat/ChatWindow';
import { Spin, Alert, Button } from 'antd';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveRoom } from '../../redux/slices/chatSlice';
import { fetchRooms } from '../../redux/slices/chatSlice';

export default function UserChat() {
  const { theme } = useTheme();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeRoomId } = useSelector(s => s.chat);
  const { user, token, initialized } = useSelector(s => s.auth);
  const [debugInfo, setDebugInfo] = useState('');

  // Check if this is a platform integration access OR if user is a platform user
  const urlParams = new URLSearchParams(window.location.search);
  const hasApiKey = urlParams.get('apiKey') || urlParams.get('key');
  const hasUserData = urlParams.get('name') && urlParams.get('email') && urlParams.get('phone');
  const hasPlatformParam = urlParams.get('platform') === 'test' || urlParams.get('platform') === 'true';
  const isPlatformUser = user?.role === 'USER' && (user?.platformId || user?.externalUserId);
  const isPlatformIntegration = hasApiKey || hasUserData || hasPlatformParam || isPlatformUser;

  console.log('🔍 [UserChatPage] Platform detection:', {
    hasApiKey,
    hasUserData,
    hasPlatformParam,
    isPlatformUser,
    isPlatformIntegration,
    userPlatformId: user?.platformId,
    userExternalId: user?.externalUserId,
    urlParams: Object.fromEntries(urlParams.entries())
  });

  console.log('🔍 [UserChatPage] Loaded:', {
    roomId,
    user: user?._id,
    userRole: user?.role,
    userPlatformId: user?.platformId,
    userExternalId: user?.externalUserId,
    token: !!token,
    isPlatformIntegration,
    initialized,
    hasApiKey,
    hasUserData
  });

  // Auto-redirect platform users to their chat room if they land on room list
  useEffect(() => {
    if (isPlatformUser && !roomId && initialized && user) {
      console.log('🔄 [UserChatPage] Platform user detected without roomId, fetching rooms to redirect...');

      // Fetch rooms to get the platform user's room
      dispatch(fetchRooms()).then((result) => {
        if (result.payload?.data?.rooms?.length > 0) {
          const firstRoom = result.payload.data.rooms[0];
          console.log('🔄 [UserChatPage] Redirecting platform user to room:', firstRoom._id);

          // Set active room and navigate immediately
          dispatch(setActiveRoom(firstRoom._id));
          navigate(`/user/chats/${firstRoom._id}`, { replace: true });
        }
      }).catch((error) => {
        console.error('❌ [UserChatPage] Failed to fetch rooms for platform user:', error);
      });
    }
  }, [isPlatformUser, roomId, initialized, user, dispatch, navigate]);

  // Active room is purely managed securely by StandardChatLayout now


  useEffect(() => {
    const info = `User: ${user?._id}, Token: ${!!token}, RoomId: ${roomId}, ActiveRoom: ${activeRoomId}, Platform: ${isPlatformIntegration}`;
    console.log('🔍 [UserChatPage] Debug:', info);
    setDebugInfo(info);
  }, [user, token, roomId, activeRoomId, isPlatformIntegration]);

  // For platform integration without authentication, show minimal loading
  if (isPlatformIntegration && !user) {
    console.log('⏳ [UserChatPage] Platform integration detected, waiting for authentication...');
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // ✅ For authenticated users, check if initialized
  if (!initialized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
      >
        <Spin size="large" tip="Loading chat..." />
      </div>
    );
  }

  // Handle authentication issues
  if (!user || !token) {
    // Special case: User exists but no token - only redirect if NOT coming from platform integration
    if (user && !token && roomId && !isPlatformIntegration) {
      console.log('🔄 [UserChatPage] User exists but no token, redirecting to platform integration');
      // Use a more reliable redirect method
      setTimeout(() => {
        window.location.replace(`http://localhost:5500/test-chat.html`);
      }, 100);
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
        >
          <Spin size="large" tip="Redirecting to authentication..." />
        </div>
      );
    }

    // If this is platform integration but user/token missing, show loading
    if (isPlatformIntegration) {
      console.log('⏳ [UserChatPage] Platform integration detected but auth missing, waiting...');
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
        >
          <Spin size="large" tip="Authenticating with platform..." />
        </div>
      );
    }

    // General access denied
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
      >
        <Alert
          message="Access Denied"
          description="You don't have permission to access this page. Please log in with a valid account."
          type="error"
          showIcon
          style={{ maxWidth: '400px' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: theme.backgroundColor || '#FFFFFF',
        minHeight: '100vh',
      }}
    >
      {/* Debug info removed for production */}

      <StandardChatLayout />
    </div>
  );
}
