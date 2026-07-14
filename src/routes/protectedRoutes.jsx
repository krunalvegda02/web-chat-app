import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePlatformDetection } from '../hooks/usePlatformDetection';
import { useMemo } from 'react';

export default function ProtectedRoute({
  children,
  requiredRoles = []
}) {
  const { user, initialized, token } = useSelector((s) => s.auth);
  const location = useLocation();
  const currentPath = location.pathname;

  // Platform detection for seamless experience
  const { isDetected: isPlatformDetected, isProcessing: isPlatformProcessing } = usePlatformDetection();

  // Check if user is a platform user
  const isPlatformUser = useMemo(() => {
    if (user && user.role !== 'USER') return false; // Only regular users can be external platform users
    const hasExternalId = !!user?.externalUserId;
    const hasPlatformId = !!user?.platformId;
    return hasExternalId || hasPlatformId || isPlatformDetected;
  }, [user, isPlatformDetected]);

  console.log('🔐 [ProtectedRoute] Checking access for path:', currentPath);
  console.log('🔐 [ProtectedRoute] Auth state:', {
    initialized,
    hasToken: !!token,
    hasUser: !!user,
    userRole: user?.role,
    requiredRoles,
    isPlatformDetected,
    isPlatformProcessing,
    isPlatformUser
  });

  // Wait for initialization first
  if (!initialized) {
    console.log('⏳ [ProtectedRoute] Not initialized yet, showing spinner');
    return <LoadingSpinner fullScreen />;
  }

  // If platform user but no token yet, show loading (prevents flash of login)
  if (!token && isPlatformDetected) {
    console.log('🔄 [ProtectedRoute] Platform user detected, waiting for auto-login...');
    return <LoadingSpinner fullScreen />;
  }

  // ✅ PLATFORM USER NAVIGATION RESTRICTION
  // Platform users can only access chat routes
  if (isPlatformUser && user) {
    // Check if current path is allowed (chat base or chat room)
    const isAllowedPath = currentPath === '/user/chats' || currentPath.startsWith('/user/chats/');

    if (!isAllowedPath) {
      console.log('🚫 [ProtectedRoute] Platform user trying to access restricted path:', currentPath, 'redirecting to chat');
      return <Navigate to="/user/chats" replace />;
    }
  }

  // ✅ If requiredRoles is null, this is a public route - allow access without auth
  if (requiredRoles === null) {
    console.log('✅ [ProtectedRoute] Public route (no auth required), allowing access immediately');
    return children;
  }

  // If no token and not a platform user, redirect to login
  if (!token) {
    console.log('❌ [ProtectedRoute] No token found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // If no user and not a platform user, redirect to login
  if (!user) {
    console.log('❌ [ProtectedRoute] No user found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Check role authorization
  if (requiredRoles.length > 0) {
    // ✅ Build allowed roles list
    const allowedRoles = [...requiredRoles];

    // ✅ CRITICAL: Allow PLATFORM_ADMIN users to access USER routes
    if (requiredRoles.includes('USER') && !allowedRoles.includes('PLATFORM_ADMIN')) {
      allowedRoles.push('PLATFORM_ADMIN');
      console.log('✅ [ProtectedRoute] Added PLATFORM_ADMIN to allowed roles for USER route');
    }

    console.log('🔐 [ProtectedRoute] Role check:', {
      userRole: user.role,
      requiredRoles,
      allowedRoles,
      isAllowed: allowedRoles.includes(user.role),
    });

    if (!allowedRoles.includes(user.role)) {
      console.error('🚫 [ProtectedRoute] UNAUTHORIZED - Role mismatch!', {
        userRole: user.role,
        requiredRoles,
        allowedRoles,
        path: currentPath,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,

          platformId: user.platformId,
        },
      });
      console.log('🚫 [ProtectedRoute] Redirecting to /unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('✅ [ProtectedRoute] Access granted for path:', currentPath);
  return children;
}
