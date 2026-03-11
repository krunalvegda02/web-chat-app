import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}) {
  const { user, initialized, token } = useSelector((s) => s.auth);
  const currentPath = window.location.pathname;

  console.log('🔐 [ProtectedRoute] Checking access for path:', currentPath);
  console.log('🔐 [ProtectedRoute] Auth state:', {
    initialized,
    hasToken: !!token,
    hasUser: !!user,
    userRole: user?.role,
    requiredRoles,
  });

  // Wait for initialization
  if (!initialized) {
    console.log('⏳ [ProtectedRoute] Not initialized yet, showing spinner');
    return <LoadingSpinner fullScreen />;
  }

  // If no token, redirect to login
  if (!token) {
    console.log('❌ [ProtectedRoute] No token found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // If no user, redirect to login
  if (!user) {
    console.log('❌ [ProtectedRoute] No user found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Check role authorization
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    console.error('🚫 [ProtectedRoute] UNAUTHORIZED - Role mismatch!', {
      userRole: user.role,
      requiredRoles,
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

  console.log('✅ [ProtectedRoute] Access granted for path:', currentPath);
  return children;
}
