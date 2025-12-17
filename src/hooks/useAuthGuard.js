import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const useAuthGuard = (allowedRoles = []) => {
  const navigate = useNavigate();
  const { user, token, loading, initialized } = useSelector((state) => state.auth);
  
  const isAuthenticated = !!user && !!token;
  const isAuthorized = allowedRoles.length === 0 || allowedRoles.includes(user?.role);
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