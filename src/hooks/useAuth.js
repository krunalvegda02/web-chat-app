
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { clearAuth } from '../redux/slices/authSlice';

export function useAuth() {
  const { user, loading, error } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const handleLogout = useCallback(() => {
    // Clear auth state and tokens locally
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch(clearAuth());
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout: handleLogout,
  };
}
