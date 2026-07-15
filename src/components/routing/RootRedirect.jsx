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
  
  // Remove manual window.location force-redirect hack.
  // React Router <Navigate> handles this natively and preserves query strings correctly.
  
  // If not initialized yet, show loading spinner
  if (!initialized) {
    console.log('⏳ [RootRedirect] Not initialized, showing spinner');
    return <LoadingSpinner fullScreen />;
  }
  
  // Check for platform parameters in URL
  const urlParams = new URLSearchParams(window.location.search);
  const hasApiKey = urlParams.get('apiKey') || urlParams.get('key');
  const hasSessionToken = urlParams.get('sessionToken') || urlParams.get('st');
  const hasPlatformParam = urlParams.get('platform');
  const hasUserData = urlParams.get('name') && urlParams.get('email') && urlParams.get('phone');
  const hasAutoLogin = urlParams.get('autoLogin') === 'true' || urlParams.get('auto') === 'true';
  
  // If platform parameters exist, let platform detection handle it
  const isPlatformRequest = hasApiKey || hasSessionToken || hasPlatformParam || (hasUserData && hasAutoLogin);
  
  console.log('🔍 [RootRedirect] Platform check:', {
    hasApiKey: !!hasApiKey,
    hasSessionToken: !!hasSessionToken,
    hasPlatformParam: !!hasPlatformParam,
    hasUserData: !!hasUserData,
    hasAutoLogin,
    isPlatformRequest
  });
  
  // If user is authenticated, redirect based on role (even if it's a platform request)
  if (user && token) {
    console.log('👤 [RootRedirect] User authenticated, redirecting based on role:', user.role);
    switch (user.role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/super-admin/admins" replace />;
      case 'PLATFORM_ADMIN':
        return <Navigate to="/admin" replace />;
      case 'USER':
        return <Navigate to="/user/chats" replace />;
      default:
        console.log('❓ [RootRedirect] Unknown role, redirecting to login');
        return <Navigate to={`/login${window.location.search}`} replace />;
    }
  }

  // If not authenticated and it's a platform request, redirect to login so platform detection can finish
  if (isPlatformRequest) {
    console.log('🔄 [RootRedirect] Platform request (unauthenticated), redirecting to login');
    return <Navigate to={`/login${window.location.search}`} replace />;
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