import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';

export const useAuthGuard = (allowedRoles = []) => {
  const navigate = useNavigate();
  const { user, token, loading, initialized } = useSelector((state) => state.auth);
  
  const isAuthenticated = !!user && !!token;
  
  const rolesForCheck = useMemo(() => {
    const roles = [...allowedRoles];
    if (roles.includes('USER') && !roles.includes('PLATFORM_ADMIN')) {
      roles.push('PLATFORM_ADMIN');
    }
    return roles;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedRoles.join(',')]);
  
  const isAuthorized = rolesForCheck.length === 0 || rolesForCheck.includes(user?.role);
  const hasAccess = isAuthenticated && isAuthorized;

  useEffect(() => {
    if (initialized && !loading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (!isAuthorized) {
        navigate('/unauthorized');
      }
    }
  }, [isAuthenticated, isAuthorized, initialized, loading, navigate]);

  return {
    user,
    isAuthenticated,
    isAuthorized,
    isLoading: loading,
    isInitialized: initialized,
    hasAccess,
  };
};
