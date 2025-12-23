
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { clearAuth, logout as logoutAction } from '../redux/slices/authSlice';

export function useAuth() {
  const { user, loading, error, refreshToken } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const handleLogout = useCallback(async () => {
    // Clear auth state and tokens locally first
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch(clearAuth());
    
    // Try to call logout API in background (non-blocking)
    try {
      await dispatch(logoutAction({ refreshToken })).unwrap();
    } catch (error) {
      // Silently ignore logout API errors since local state is already cleared
    }
  }, [dispatch, refreshToken]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout: handleLogout,
  };
}
