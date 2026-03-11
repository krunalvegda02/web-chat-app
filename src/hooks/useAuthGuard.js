import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const useAuthGuard = (allowedRoles = []) => {
  const navigate = useNavigate();
  const { user, token, loading, initialized } = useSelector((state) => state.auth);
  
  const isAuthenticated = !!user && !!token;
  const isAuthorized = allowedRoles.length === 0 || allowedRoles.includes(user?.role);
  const hasAccess = isAuthenticated && isAuthorized;

  console.log('🔐 [useAuthGuard] Hook called', {
    allowedRoles,
    isAuthenticated,
    userRole: user?.role,
    isAuthorized,
    hasAccess,
    initialized,
    loading,
  });

  useEffect(() => {
    console.log('🔐 [useAuthGuard] Effect running', {
      initialized,
      loading,
      isAuthenticated,
      isAuthorized,
      userRole: user?.role,
    });

    if (initialized && !loading) {
      if (!isAuthenticated) {
        console.log('❌ [useAuthGuard] Not authenticated, redirecting to /login');
        navigate('/login');
      } else if (!isAuthorized) {
        console.error('🚫 [useAuthGuard] Not authorized!', {
          userRole: user?.role,
          allowedRoles,
          redirectingTo: '/unauthorized',
        });
        navigate('/unauthorized');
      } else {
        console.log('✅ [useAuthGuard] Authorized, allowing access');
      }
    }
  }, [isAuthenticated, isAuthorized, initialized, loading, navigate, user?.role, allowedRoles]);

  return {
    user,
    isAuthenticated,
    isAuthorized,
    isLoading: loading,
    isInitialized: initialized,
    hasAccess,
  };
};
