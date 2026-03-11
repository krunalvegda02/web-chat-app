import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, clearAuth } from '../redux/slices/authSlice';

export const useAuthSync = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const storedAuthState = localStorage.getItem('persist:auth');
    
    if (storedAuthState) {
      try {
        const parsedAuth = JSON.parse(storedAuthState);
        
        if (parsedAuth.token && parsedAuth.token !== token) {
          console.log('🔄 [AUTH_SYNC] Token mismatch detected');
          console.log('Old Redux user role:', user?.role);
          console.log('New localStorage user role:', parsedAuth.user?.role);
          
          dispatch(clearAuth());
          
          setTimeout(() => {
            dispatch(setUser(parsedAuth.user));
            console.log('✅ [AUTH_SYNC] Redux auth state updated');
          }, 100);
        }
      } catch (error) {
        console.error('❌ [AUTH_SYNC] Error:', error);
      }
    }
  }, [dispatch, token, user]);
};

export default useAuthSync;
