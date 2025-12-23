import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { fetchMe, setInitialized, clearAuth } from "./redux/slices/authSlice";
import { pageRoutes } from "./routes/pageRoutes";
import ProtectedRoute from "./routes/protectedRoutes";
import LoadingSpinner from "./components/common/LoadingSpinner";
import AudioCallWindow from "./components/call/AudioCallWindow";
import IncomingCallNotification from "./components/call/IncomingCallNotification";
import ActiveCallBanner from "./components/call/ActiveCallBanner";
import { CallProvider, useCall } from "./contexts/CallContext";
import { useNotifications } from "./hooks/useNotifications";
import NotificationPrompt from "./components/common/NotificationPrompt";
import WhatsAppNotification from "./components/common/WhatsAppNotification";
import { useSocket } from "./hooks/useSocket";

function AppContent() {
  const dispatch = useDispatch();
  const { initialized, token, user } = useSelector((s) => s.auth);
  const { callState, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker } = useCall();
  const { requestPermission } = useNotifications();
  const { sendMessage } = useSocket();
  const [showCallWindow, setShowCallWindow] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationIds = new Set();

  // Handle incoming notifications with deduplication
  const handleNotification = (notification) => {
    console.log('🔔 Handling notification:', notification);
    const notifId = `${notification.senderId}-${notification.messageId}`;
    if (notificationIds.has(notifId)) {
      console.log('Duplicate notification blocked:', notifId);
      return;
    }
    notificationIds.add(notifId);
    const newNotif = { ...notification, id: Date.now() };
    console.log('✅ Adding notification to state:', newNotif);
    setNotifications(prev => {
      console.log('Current notifications:', prev.length);
      return [...prev, newNotif];
    });
    
    // Clean up old IDs after 10 seconds
    setTimeout(() => notificationIds.delete(notifId), 10000);
  };

  // Handle reply from notification
  const handleReply = (roomId, message) => {
    sendMessage(roomId, message);
  };

  // Request notification permission after user login
  useEffect(() => {
    if (user && initialized) {
      requestPermission(handleNotification).catch(err => console.log('Notification permission:', err));
    }
  }, [user, initialized]);

  // Listen for service worker messages (reply from notification)
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'SEND_REPLY') {
        const { roomId, message } = event.data;
        sendMessage(roomId, message);
      }
    };
    
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
  }, [sendMessage]);

  // Show call window when call starts (only auto-show for new incoming calls)
  useEffect(() => {
    if (callState.isInCall && callState.isIncoming && callState.callStatus === 'ringing') {
      setShowCallWindow(true);
    } else if (!callState.isInCall) {
      setShowCallWindow(false);
    }
  }, [callState.isInCall, callState.isIncoming, callState.callStatus]);

  // -------------------------------
  // INITIAL AUTH CHECK
  // -------------------------------
  useEffect(() => {
    if (token && !initialized) {
      dispatch(fetchMe())
        .unwrap()
        .catch(() => dispatch(clearAuth()));
    } else if (!token && !initialized) {
      dispatch(setInitialized());
    }
  }, [dispatch, token, initialized]);

  if (!initialized) return <LoadingSpinner fullScreen />;

  // -------------------------------
  // RENDER ROUTES
  // -------------------------------
  return (
    <>
      <Routes>
        {pageRoutes.map(({ layout: Layout, routes, requiredRoles }, i) => (
          <Route
            key={i}
            element={
              requiredRoles ? (
                <ProtectedRoute requiredRoles={requiredRoles}>
                  {Layout ? <Layout /> : <></>}
                </ProtectedRoute>
              ) : Layout ? (
                <Layout />
              ) : (
                <></>
              )
            }
          >
            {routes.map((route, idx) => (
              <Route key={idx} path={route.path} element={<route.element />} />
            ))}
          </Route>
        ))}
      </Routes>

      {/* Notification Permission Prompt */}
      {user && <NotificationPrompt />}

      {/* WhatsApp-style Notifications */}
      {notifications.length > 0 && (
        <div 
          className="fixed top-0 right-0 p-4" 
          style={{ 
            zIndex: 999999,
            pointerEvents: 'none'
          }}
        >
          <div className="flex flex-col gap-3" style={{ pointerEvents: 'auto' }}>
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <WhatsAppNotification
                  notification={notification}
                  onClose={() => {
                    console.log('Closing notification:', notification.id);
                    setNotifications(prev => prev.filter(n => n.id !== notification.id));
                  }}
                  onReply={handleReply}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Call Banner - Show when call is active but window is minimized */}
      {callState.isInCall && !showCallWindow && (
        <ActiveCallBanner
          participant={callState.participant}
          callStatus={callState.callStatus}
          duration={callState.duration}
          onClick={() => setShowCallWindow(true)}
        />
      )}

      {/* Incoming Call Notification - Only for receiver when ringing */}
      {callState.isInCall && callState.isIncoming && callState.callStatus === 'ringing' && (
        <IncomingCallNotification
          caller={callState.participant}
          onAccept={acceptCall}
          onDecline={rejectCall}
        />
      )}

      {/* Active Call Window - Show when window is open and not showing incoming notification */}
      {callState.isInCall && showCallWindow && !(callState.isIncoming && callState.callStatus === 'ringing') && (
        <AudioCallWindow
          participant={callState.participant}
          callStatus={callState.callStatus}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          isMuted={callState.isMuted}
          onToggleSpeaker={toggleSpeaker}
          isSpeakerOn={callState.isSpeakerOn}
          callDuration={callState.duration}
          onMinimize={() => setShowCallWindow(false)}
        />
      )}
    </>
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
