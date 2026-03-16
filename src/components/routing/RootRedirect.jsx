import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Root redirect component that handles default routing
 * Redirects to appropriate page based on authentication status
 */
export default function RootRedirect() {
  const { user, token, initialized } = useSelector(state => state.auth);
  
  console.log('🏠 [RootRedirect] Component rendered:', {
    initialized,
    hasUser: !!user,
    hasToken: !!token,
    userRole: user?.role,
    currentPath: window.location.pathname
  });
  
  // Force redirect using multiple methods
  useEffect(() => {
    const forceRedirect = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
        console.log('🔄 [RootRedirect] Forcing redirect to login');
        
        // Try multiple redirect methods
        setTimeout(() => {
          if (window.location.pathname === '/') {
            window.location.replace('/login');
          }
        }, 100);
      }
    };
    
    if (initialized) {
      forceRedirect();
    }
  }, [initialized]);
  
  // If not initialized yet, show loading spinner
  if (!initialized) {
    console.log('⏳ [RootRedirect] Not initialized, showing spinner');
    return <LoadingSpinner fullScreen />;
  }
  
  // Check for platform parameters in URL
  const urlParams = new URLSearchParams(window.location.search);
  const hasApiKey = urlParams.get('apiKey') || urlParams.get('key');
  const hasPlatformParam = urlParams.get('platform');
  const hasUserData = urlParams.get('name') && urlParams.get('email') && urlParams.get('phone');
  const hasAutoLogin = urlParams.get('autoLogin') === 'true' || urlParams.get('auto') === 'true';
  
  // If platform parameters exist, let platform detection handle it
  const isPlatformRequest = hasApiKey || hasPlatformParam || (hasUserData && hasAutoLogin);
  
  console.log('🔍 [RootRedirect] Platform check:', {
    hasApiKey: !!hasApiKey,
    hasPlatformParam: !!hasPlatformParam,
    hasUserData: !!hasUserData,
    hasAutoLogin,
    isPlatformRequest
  });
  
  // If platform request, redirect to login and let platform detection handle it
  if (isPlatformRequest) {
    console.log('🔄 [RootRedirect] Platform request detected, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // If user is authenticated, redirect based on role
  if (user && token) {
    console.log('👤 [RootRedirect] User authenticated, redirecting based on role:', user.role);
    switch (user.role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/super-admin/admins" replace />;
      case 'TENANT_ADMIN':
      case 'PLATFORM_ADMIN':
        return <Navigate to="/admin" replace />;
      case 'USER':
        // Check if platform user
        if (user.externalUserId || user.platformId) {
          return <Navigate to="/user/chats" replace />;
        }
        return <Navigate to="/contacts" replace />;
      default:
        console.log('❓ [RootRedirect] Unknown role, redirecting to login');
        return <Navigate to="/login" replace />;
    }
  }
  
  // Default: redirect to login with multiple fallback methods
  console.log('🔄 [RootRedirect] No user/token, redirecting to login');
  
  // Return both Navigate component and trigger window.location as backup
  return (
    <div>
      <Navigate to="/login" replace />
      <LoadingSpinner fullScreen />
    </div>
  );
}