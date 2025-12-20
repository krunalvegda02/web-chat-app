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

function AppContent() {
  const dispatch = useDispatch();
  const { initialized, token, user } = useSelector((s) => s.auth);
  const { callState, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker } = useCall();
  const [showCallWindow, setShowCallWindow] = useState(false);

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

  // If not logged in → redirect except auth pages
  const publicPaths = ["/login", "/register", "/reset-password", "/join/"];
  const currentPath = window.location.pathname;

  if (
    initialized &&
    !user &&
    !publicPaths.some((p) => currentPath.startsWith(p))
  ) {
    return <Navigate to="/login" replace />;
  }

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
