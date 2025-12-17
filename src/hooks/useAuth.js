
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { logout } from '../redux/slices/authSlice';

export function useAuth() {
  const { user, loading, error } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout: handleLogout,
  };
}
