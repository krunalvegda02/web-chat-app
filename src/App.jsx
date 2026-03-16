import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { chatSocketClient } from "./sockets/chatSocketClient";

import { fetchMe, setInitialized, clearAuth } from "./redux/slices/authSlice";
import { setActiveRoom } from "./redux/slices/chatSlice";
import { pageRoutes } from "./routes/pageRoutes";
import ProtectedRoute from "./routes/protectedRoutes";
import LoadingSpinner from "./components/common/LoadingSpinner";
import AudioCallWindow from "./components/call/AudioCallWindow";
import IncomingCallNotification from "./components/call/IncomingCallNotification";
import ActiveCallBanner from "./components/call/ActiveCallBanner";
import { CallProvider, useCall } from "./contexts/CallContext";
import { useNotifications } from "./hooks/useNotifications";
import { useAppNotifications } from "./hooks/useAppNotifications";
import NotificationPrompt from "./components/common/NotificationPrompt";
import WhatsAppNotification from "./components/common/WhatsAppNotification";
import { useSocket } from "./hooks/useSocket";
import { useAuthSync } from "./hooks/useAuthSync";
import PlatformGateway from "./components/platform/PlatformGateway";

function AppContent() {
  const dispatch = useDispatch();
  const { initialized, token, user } = useSelector((s) => s.auth);
  const { callState, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker } = useCall();
  const [showCallWindow, setShowCallWindow] = useState(false);

  useSocket();
  useAuthSync();
  const { notifications, handleNotification, closeNotification } = useAppNotifications();
  useNotifications(handleNotification);

  console.log('🚀 [App] AppContent rendered', {
    initialized,
    hasToken: !!token,
    hasUser: !!user,
    userRole: user?.role,
  });

  // Handle reply from notification
  const handleReply = (roomId, message) => {
    chatSocketClient.emit('send_message', { roomId, content: message });
  };

  // Listen for service worker messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'SEND_REPLY') {
        chatSocketClient.emit('send_message', { roomId: event.data.roomId, content: event.data.message });
      } else if (event.data?.type === 'OPEN_CHAT' && event.data.roomId) {
        dispatch(setActiveRoom(event.data.roomId));
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
  }, [dispatch]);

  // Show call window for incoming calls
  useEffect(() => {
    if (callState.isInCall && callState.isIncoming && callState.callStatus === 'ringing') {
      setShowCallWindow(true);
    } else if (!callState.isInCall) {
      setShowCallWindow(false);
    }
  }, [callState.isInCall, callState.isIncoming, callState.callStatus]);

  // Handle root path redirect immediately if needed
  useEffect(() => {
    const currentPath = window.location.pathname;
    const hasSearch = window.location.search;
    
    console.log('🔄 [App] Path check:', { currentPath, hasSearch, initialized, hasToken: !!token, hasUser: !!user });
    
    // If on root path and initialized but no user/token, force redirect to login
    if (currentPath === '/' && initialized && !token && !user && !hasSearch) {
      console.log('🔄 [App] Force redirecting to login from root');
      window.location.replace('/login');
    }
  }, [initialized, token, user]);

  // Initial auth check with immediate redirect for unauthenticated users
  useEffect(() => {
    console.log('🔐 [App] Initial auth check effect running', {
      hasToken: !!token,
      initialized,
      currentPath: window.location.pathname
    });

    if (token && !initialized) {
      console.log('🔐 [App] Token exists and not initialized, calling fetchMe...');
      // Token exists, fetch user data to verify it's still valid
      dispatch(fetchMe()).unwrap().catch((error) => {
        console.warn('⚠️ [App] fetchMe failed:', error);
        // If fetchMe fails, keep the token and user data from Redux
        // Don't clear auth, just mark as initialized
        console.log('🔐 [App] Calling setInitialized after fetchMe failure');
        dispatch(setInitialized());
      });
    } else if (!token && !initialized) {
      console.log('🔐 [App] No token and not initialized, calling setInitialized');
      // No token, mark as initialized
      dispatch(setInitialized());
      
      // If on root path and no platform parameters, redirect to login immediately
      if (window.location.pathname === '/') {
        const urlParams = new URLSearchParams(window.location.search);
        const hasApiKey = urlParams.get('apiKey') || urlParams.get('key');
        const hasPlatformParam = urlParams.get('platform');
        const hasUserData = urlParams.get('name') && urlParams.get('email') && urlParams.get('phone');
        
        if (!hasApiKey && !hasPlatformParam && !hasUserData) {
          console.log('🔄 [App] No platform params, redirecting to login');
          window.location.href = '/login';
        }
      }
    } else {
      console.log('🔐 [App] Already initialized or token check skipped');
    }
  }, [dispatch, token, initialized]);

  if (!initialized) {
    console.log('⏳ [App] Not initialized, showing spinner');
    return <LoadingSpinner fullScreen />;
  }

  console.log('✅ [App] Initialized, rendering routes');

  return (
    <PlatformGateway>
      <Routes>
        {pageRoutes.map(({ layout: Layout, routes, requiredRoles, wrapper: Wrapper }, i) => {
          const layoutElement = Layout ? <Layout /> : <></>;
          const wrappedLayout = Wrapper ? <Wrapper>{layoutElement}</Wrapper> : layoutElement;

          return (
            <Route
              key={i}
              element={
                requiredRoles ? (
                  <ProtectedRoute requiredRoles={requiredRoles}>
                    {wrappedLayout}
                  </ProtectedRoute>
                ) : wrappedLayout
              }
            >
              {routes.map((route, idx) => (
                <Route key={idx} path={route.path} element={<route.element />} />
              ))}
            </Route>
          );
        })}
      </Routes>

      {/* notification enable */}
      {user && <NotificationPrompt />}

      {notifications.length > 0 && (
        <div className="fixed top-0 right-0 p-4" style={{ zIndex: 999999, pointerEvents: 'none' }}>
          <div className="flex flex-col gap-3" style={{ pointerEvents: 'auto' }}>
            {notifications.map((notification) => (
              <WhatsAppNotification
                key={notification.id}
                notification={notification}
                onClose={() => closeNotification(notification.id)}
                onReply={handleReply}
              />
            ))}
          </div>
        </div>
      )}
    </PlatformGateway>
  );
}

export default function App() {
  return (
    <Router>
      <CallProvider>
        <AppContent />
      </CallProvider>
    </Router>
  );
}
