import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { chatSocketClient } from "./sockets/chatSocketClient";

import { fetchMe, setInitialized, clearAuth } from "./redux/slices/authSlice";
import { fetchWalletBalance } from "./redux/slices/walletSlice";
import { setActiveRoom } from "./redux/slices/chatSlice";
import { pageRoutes } from "./routes/pageRoutes";
import ProtectedRoute from "./routes/protectedRoutes";
import LoadingSpinner from "./components/common/LoadingSpinner";
import UnifiedLoader from "./components/common/UnifiedLoader";
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
import clsx from "clsx";

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

  // Listen for service worker and window messages
  useEffect(() => {
    const handleMessage = (event) => {
      // Handle parent window commands
      if (event.data?.type === 'LOGOUT_CHAT') {
        console.log('🚪 [App] Received LOGOUT_CHAT from parent, clearing session');
        dispatch(clearAuth());
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        return;
      }
      
      // Handle Service Worker commands
      if (event.data?.type === 'SEND_REPLY') {
        chatSocketClient.emit('send_message', { roomId: event.data.roomId, content: event.data.message });
      } else if (event.data?.type === 'OPEN_CHAT' && event.data.roomId) {
        dispatch(setActiveRoom(event.data.roomId));
      }
    };

    window.addEventListener('message', handleMessage);
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [dispatch]);

  // Show call window for incoming calls
  useEffect(() => {
    if (callState.isInCall && callState.isIncoming && callState.callStatus === 'ringing') {
      setShowCallWindow(true);
    } else if (!callState.isInCall) {
      setShowCallWindow(false);
    }
  }, [callState.isInCall, callState.isIncoming, callState.callStatus]);

  // Fetch wallet balance for platform admins whenever user/token is set
  useEffect(() => {
    if (user?.role === 'PLATFORM_ADMIN' && token) {
      console.log('💰 [App] Platform admin detected, fetching wallet balance');
      dispatch(fetchWalletBalance());
    }
  }, [user?.role, token, dispatch]);

  // Handle root path redirect immediately if needed
  useEffect(() => {
    const currentPath = window.location.pathname;
    const hasSearch = window.location.search;
    const urlParams = new URLSearchParams(hasSearch);
    const hasApiKey = urlParams.get('apiKey') || urlParams.get('key');
    const hasPlatformParam = urlParams.get('platform');
    const hasUserData = urlParams.get('name') && urlParams.get('email') && urlParams.get('phone');
    // Also check storage — index.html strips params from URL before React loads
    const storedParams = (() => { try { return localStorage.getItem('__platformParams') || sessionStorage.getItem('__platformParams'); } catch (e) { return null; } })();
    const isPlatformRequest = hasApiKey || hasPlatformParam || hasUserData || !!storedParams;

    console.log('🔄 [App] Path check:', { currentPath, hasSearch, initialized, hasToken: !!token, hasUser: !!user, isPlatformRequest });

    // If on root path and initialized but no user/token
    if (currentPath === '/' && initialized && !token && !user) {
      if (isPlatformRequest) {
        console.log('🔄 [App] Platform request detected, staying on root for platform gateway');
        // Don't redirect - let PlatformGateway handle it
        return;
      } else if (!hasSearch) {
        console.log('🔄 [App] Force redirecting to login from root');
        window.location.replace('/login');
      }
    }

    // If on login page but platform request detected, redirect to root for platform handling
    if (currentPath === '/login' && isPlatformRequest && initialized) {
      console.log('🔄 [App] Platform request on login page, redirecting to root');
      window.location.replace('/' + hasSearch);
    }
  }, [initialized, token, user]);

  // Initial auth check with platform-aware redirect logic
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasApiKey = urlParams.get('apiKey') || urlParams.get('key');
    const hasPlatformParam = urlParams.get('platform');
    const hasUserData = urlParams.get('name') && urlParams.get('email') && urlParams.get('phone');
    // Also check storage — index.html strips params from URL before React loads
    const storedParams = (() => { try { return localStorage.getItem('__platformParams') || sessionStorage.getItem('__platformParams'); } catch (e) { return null; } })();
    const isPlatformRequest = hasApiKey || hasPlatformParam || hasUserData || !!storedParams;

    console.log('🔐 [App] Initial auth check effect running', {
      hasToken: !!token,
      initialized,
      currentPath: window.location.pathname,
      isPlatformRequest
    });

    if (!initialized) {
      if (token) {
        console.log('🔐 [App] Token exists, calling fetchMe...');
        // Token exists, fetch user data to verify it's still valid
        dispatch(fetchMe()).unwrap().catch((error) => {
          console.warn('⚠️ [App] fetchMe failed:', error);
          // If fetchMe fails, keep the token and user data from Redux
          // Don't clear auth, just mark as initialized
          console.log('🔐 [App] Calling setInitialized after fetchMe failure');
          dispatch(setInitialized());
        });
      } else {
        console.log('🔐 [App] No token, calling setInitialized');
        // No token, mark as initialized
        dispatch(setInitialized());

        // If on root path and no platform parameters, redirect to login immediately
        if (window.location.pathname === '/') {
          if (!isPlatformRequest) {
            console.log('🔄 [App] No platform params, redirecting to login');
            window.location.href = '/login';
          } else {
            console.log('🔄 [App] Platform request detected, staying on root');
          }
        }
      }
    } else {
      console.log('🔐 [App] Already initialized or token check skipped');
    }
  }, [dispatch, token, initialized]);

  if (!initialized) {
    console.log('⏳ [App] Not initialized, showing unified loader');
    return <UnifiedLoader tip="Starting application..." />;
  }

  console.log('✅ [App] Initialized, rendering routes');

  return (
    <PlatformGateway>
      <Routes>
        {pageRoutes.map(({ layout: Layout, routes, requiredRoles, wrapper: Wrapper }, i) => {
          const layoutElement = Layout ? <Layout /> : <Outlet />;
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
        <div cclassName={clsx('fixed', 'top-0', 'right-0', 'p-4')} style={{ zIndex: 999999, pointerEvents: 'none' }}>
          <div cclassName={clsx('flex', 'flex-col', 'gap-3')} style={{ pointerEvents: 'auto' }}>
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
