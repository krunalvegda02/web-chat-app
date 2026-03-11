import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const useAuthGuard = (allowedRoles = []) => {
  const navigate = useNavigate();
  const { user, token, loading, initialized } = useSelector((state) => state.auth);
  
  const isAuthenticated = !!user && !!token;
  
  // ✅ Build the list of allowed roles
  let rolesForCheck = [...allowedRoles];
  
  // ✅ If USER is in allowed roles, also allow PLATFORM_ADMIN
  if (rolesForCheck.includes('USER') && !rolesForCheck.includes('PLATFORM_ADMIN')) {
    rolesForCheck.push('PLATFORM_ADMIN');
  }
  
  const isAuthorized = rolesForCheck.length === 0 || rolesForCheck.includes(user?.role);
  const hasAccess = isAuthenticated && isAuthorized;

  console.log('🔐 [useAuthGuard] Hook called', {
    allowedRoles,
    rolesForCheck,
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
      rolesForCheck,
    });

    if (initialized && !loading) {
      if (!isAuthenticated) {
        console.log('❌ [useAuthGuard] Not authenticated, redirecting to /login');
        navigate('/login');
      } else if (!isAuthorized) {
        console.error('🚫 [useAuthGuard] Not authorized!', {
          userRole: user?.role,
          allowedRoles,
          rolesForCheck,
          redirectingTo: '/unauthorized',
        });
        navigate('/unauthorized');
      } else {
        console.log('✅ [useAuthGuard] Authorized, allowing access');
      }
    }
  }, [isAuthenticated, isAuthorized, initialized, loading, navigate, user?.role, rolesForCheck]);

  return {
    user,
    isAuthenticated,
    isAuthorized,
    isLoading: loading,
    isInitialized: initialized,
    hasAccess,
  };
};
