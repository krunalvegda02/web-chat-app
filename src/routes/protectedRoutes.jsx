import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePlatformDetection } from '../hooks/usePlatformDetection';

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}) {
  const { user, initialized, token } = useSelector((s) => s.auth);
  const currentPath = window.location.pathname;
  
  // Platform detection for seamless experience
  const { isDetected: isPlatformDetected, isProcessing: isPlatformProcessing } = usePlatformDetection();

  console.log('🔐 [ProtectedRoute] Checking access for path:', currentPath);
  console.log('🔐 [ProtectedRoute] Auth state:', {
    initialized,
    hasToken: !!token,
    hasUser: !!user,
    userRole: user?.role,
    requiredRoles,
    isPlatformDetected,
    isPlatformProcessing
  });

  // ✅ If requiredRoles is null, this is a public route - allow access without auth
  if (requiredRoles === null) {
    console.log('✅ [ProtectedRoute] Public route (no auth required), allowing access immediately');
    return children;
  }

  // Wait for initialization
  if (!initialized) {
    console.log('⏳ [ProtectedRoute] Not initialized yet, showing spinner');
    return <LoadingSpinner fullScreen />;
  }

  // If no token and not a platform user, redirect to login
  if (!token && !isPlatformDetected) {
    console.log('❌ [ProtectedRoute] No token found and not platform user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  // If platform user but no token yet, show loading
  if (!token && isPlatformDetected) {
    console.log('🔄 [ProtectedRoute] Platform user without token, showing loading');
    return <LoadingSpinner fullScreen />;
  }

  // If no user and not a platform user, redirect to login
  if (!user && !isPlatformDetected) {
    console.log('❌ [ProtectedRoute] No user found and not platform user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  // If platform user but no user yet, show loading
  if (!user && isPlatformDetected) {
    console.log('🔄 [ProtectedRoute] Platform user without user data, showing loading');
    return <LoadingSpinner fullScreen />;
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
          tenantId: user.tenantId,
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
