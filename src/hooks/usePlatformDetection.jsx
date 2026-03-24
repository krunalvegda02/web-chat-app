import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { usePlatformIntegration } from './usePlatformIntegration';
import { setUser } from '../redux/slices/authSlice';
import { setActiveRoom } from '../redux/slices/chatSlice';

/**
 * Hook for detecting and handling platform users
 * Provides seamless authentication and navigation for external platform users
 */
export const usePlatformDetection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, token, initialized } = useSelector(state => state.auth);

  const [platformState, setPlatformState] = useState({
    isDetected: false,
    isProcessing: false,
    error: null,
    userData: null,
    shouldAutoLogin: false,
    retryCount: 0,
    maxRetries: 3
  });

  // Extract platform parameters from URL (memoized to prevent re-renders)
  // Handle HTML-encoded URLs and various URL formats
  const platformParams = useMemo(() => {
    // Get the raw search string and decode HTML entities
    let searchString = location.search;
    
    // Handle HTML-encoded URLs
    if (searchString.includes('&amp;')) {
      console.log('🔧 [PlatformDetection] Detected HTML-encoded URL, fixing...');
      searchString = searchString.replace(/&amp;/g, '&');
    }
    
    // Also handle other common HTML entities
    searchString = searchString
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    console.log('🔧 [PlatformDetection] Processing URL:', searchString);
    
    const params = new URLSearchParams(searchString);
    
    // Manual fallback parsing if URLSearchParams fails
    const manualParse = (searchStr) => {
      const result = {};
      if (searchStr.startsWith('?')) searchStr = searchStr.substring(1);
      
      const pairs = searchStr.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          result[key] = decodeURIComponent(value);
        }
      }
      return result;
    };
    
    const manualParams = manualParse(searchString);
    console.log('🔍 [PlatformDetection] Manual parsed params:', manualParams);
    
    // Helper function to get parameter with fallbacks
    const getParam = (...keys) => {
      for (const key of keys) {
        const value = params.get(key) || manualParams[key];
        if (value) return value;
      }
      return null;
    };
    
    // Extract all possible parameter variations
    const result = {
      apiKey: getParam('apiKey', 'key', 'api_key'),
      sessionToken: getParam('sessionToken', 'session', 'st'),
      name: getParam('name', 'username', 'user_name'),
      email: getParam('email', 'userEmail', 'user_email'),
      phone: getParam('phone', 'phoneNumber', 'phone_number'),
      externalUserId: getParam('userId', 'externalUserId', 'user_id', 'external_user_id'),
      roomId: getParam('roomId', 'room', 'room_id'),
      autoLogin: getParam('autoLogin', 'auto', 'auto_login') === 'true',
      redirect: getParam('redirect', 'redirectUrl', 'redirect_url'),
      platform: getParam('platform', 'platformName', 'platform_name')
    };
    
    console.log('🔍 [PlatformDetection] Extracted parameters:', result);
    
    // Strip sensitive params from URL bar immediately after reading them
    // This prevents apiKey/user data from appearing in browser history/logs
    if (result.apiKey || result.sessionToken || result.name || result.email || result.phone) {
      const url = new URL(window.location.href);
      ['apiKey', 'key', 'api_key', 'name', 'email', 'phone', 'autoLogin', 'auto', 'platform', 'userId', 'sessionToken', 'st'].forEach(p => url.searchParams.delete(p));
      const cleanUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
      window.history.replaceState(window.history.state, document.title, cleanUrl);
    }
    
    return result;
  }, [location.search]);

  // Platform integration hook
  const {
    platformChatLogin,
    consumeSessionToken,
    isValidApiKey,
    loading: platformLoading,
    error: platformError
  } = usePlatformIntegration(platformParams.apiKey);

  // Normalize phone number for comparison
  const normalizePhone = useCallback((phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  }, []);

  // Detect if this is a platform user request (memoized)
  const detectionResult = useMemo(() => {
    const hasSessionToken = !!platformParams.sessionToken;
    const hasApiKey = !!platformParams.apiKey;
    const hasPlatformParam = !!platformParams.platform;
    const hasUserData = !!(platformParams.name && platformParams.email && platformParams.phone);
    const hasAutoLogin = platformParams.autoLogin;

    // Prefer sessionToken (secure), fall back to apiKey (legacy)
    const isDetected = hasSessionToken || hasApiKey || hasPlatformParam || (hasUserData && hasAutoLogin);

    return {
      isDetected,
      isSessionTokenFlow: hasSessionToken,
      shouldAutoLogin: isDetected && (hasAutoLogin || hasSessionToken || (hasUserData && isValidApiKey)),
      userData: hasUserData ? {
        name: platformParams.name,
        email: platformParams.email,
        phone: platformParams.phone,
        externalUserId: platformParams.externalUserId || `auto_${Date.now()}`
      } : null
    };
  }, [platformParams, isValidApiKey]);

  // Auto-login function with retry logic
  const performAutoLogin = useCallback(async (userData) => {
    // If sessionToken flow, use consumeSessionToken instead
    if (detectionResult.isSessionTokenFlow && platformParams.sessionToken) {
      setPlatformState(prev => ({ ...prev, isProcessing: true, error: null }));
      try {
        const result = await consumeSessionToken(platformParams.sessionToken);
        if (result.success) {
          const targetRoom = platformParams.roomId || result.data.room?._id;
          if (targetRoom) {
            dispatch(setActiveRoom(targetRoom));
            navigate(`/user/chats/${targetRoom}`, { replace: true });
            window.history.replaceState({}, document.title, `/user/chats/${targetRoom}`);
          } else {
            navigate('/user/chats', { replace: true });
          }
          setPlatformState(prev => ({ ...prev, isProcessing: false, retryCount: 0 }));
          return true;
        } else {
          throw new Error(result.error || 'Session login failed');
        }
      } catch (error) {
        setPlatformState(prev => ({ ...prev, isProcessing: false, error: error.message }));
        return false;
      }
    }

    if (!userData || !isValidApiKey) {
      console.warn('⚠️ [PlatformDetection] Cannot auto-login: missing data or invalid API key');
      return false;
    }

    setPlatformState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      console.log('🔐 [PlatformDetection] Performing auto-login for platform user...', userData);

      const result = await platformChatLogin(userData, platformParams.platform);

      if (result.success) {
        console.log('✅ [PlatformDetection] Auto-login successful');

        // For platform users, ALWAYS navigate directly to their room
        const targetRoom = platformParams.roomId || result.data.room?._id;

        if (targetRoom) {
          console.log('🎯 [PlatformDetection] Navigating directly to room:', targetRoom);

          // Set active room immediately
          dispatch(setActiveRoom(targetRoom));

          // Navigate directly to the room immediately (no delay)
          navigate(`/user/chats/${targetRoom}`, { replace: true });

          // Clean URL parameters after navigation
          window.history.replaceState({}, document.title, `/user/chats/${targetRoom}`);
        } else {
          console.warn('⚠️ [PlatformDetection] No room found for platform user');
          // Fallback to general chat page
          navigate('/user/chats', { replace: true });
        }

        setPlatformState(prev => ({
          ...prev,
          isProcessing: false,
          userData: result.data.user,
          retryCount: 0
        }));

        return true;
      } else {
        throw new Error(result.error || 'Auto-login failed');
      }
    } catch (error) {
      console.error('❌ [PlatformDetection] Auto-login failed:', error);
      
      const newRetryCount = platformState.retryCount + 1;
      
      // Auto-retry if under max retries
      if (newRetryCount < platformState.maxRetries) {
        console.log(`🔄 [PlatformDetection] Auto-retry ${newRetryCount}/${platformState.maxRetries} in 3 seconds...`);
        setPlatformState(prev => ({
          ...prev,
          retryCount: newRetryCount,
          error: null // Clear error during retry
        }));
        
        setTimeout(() => {
          performAutoLogin(userData);
        }, 3000);
        
        return false;
      }
      
      setPlatformState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message,
        retryCount: newRetryCount
      }));
      return false;
    }
  }, [platformChatLogin, isValidApiKey, platformParams.roomId, dispatch, navigate, platformState.retryCount, platformState.maxRetries]);

  // Update platform state when detection changes
  useEffect(() => {
    setPlatformState(prev => ({
      ...prev,
      isDetected: detectionResult.isDetected,
      shouldAutoLogin: detectionResult.shouldAutoLogin,
      userData: detectionResult.userData
    }));
  }, [detectionResult]);

  // Main detection and auto-login effect
  useEffect(() => {
    console.log('🔍 [PlatformDetection] Main effect triggered:', {
      initialized,
      hasUser: !!user,
      hasToken: !!token,
      shouldAutoLogin: detectionResult.shouldAutoLogin,
      hasUserData: !!detectionResult.userData,
      isProcessing: platformState.isProcessing,
      urlEmail: platformParams.email,
      urlPhone: platformParams.phone,
      userEmail: user?.email,
      userPhone: user?.phone,
      platformParams: platformParams,
      detectionResult: detectionResult
    });

    if (!initialized) return;
    if (platformState.isProcessing) return;

    // Normalize phone numbers for comparison
    const urlPhoneNormalized = normalizePhone(platformParams.phone);
    const userPhoneNormalized = normalizePhone(user?.phone);

    // Detect if we need to switch users (Sticky identity fix)
    const isDifferentUser = user && (
      (platformParams.email && user.email !== platformParams.email) ||
      (urlPhoneNormalized && userPhoneNormalized !== urlPhoneNormalized)
    );

    if (isDifferentUser) {
      console.log('🔄 [PlatformDetection] Different user detected in URL, forcing re-authentication', {
        urlEmail: platformParams.email,
        userEmail: user.email,
        urlPhone: urlPhoneNormalized,
        userPhone: userPhoneNormalized
      });
      performAutoLogin(detectionResult.userData);
      return;
    }

    // Skip auto-login if user is already authenticated and matches
    if (user && token) {
      console.log('👤 [PlatformDetection] User already authenticated and matches, skipping auto-login');

      // Still handle room navigation if specified
      if (platformParams.roomId) {
        dispatch(setActiveRoom(platformParams.roomId));
        navigate(`/user/chats/${platformParams.roomId}`, { replace: true });
      }
      return;
    }

    // Perform auto-login if conditions are met
    if (detectionResult.shouldAutoLogin && detectionResult.userData) {
      console.log('🚀 [PlatformDetection] Initiating auto-login...');
      performAutoLogin(detectionResult.userData);
    }
  }, [initialized, user, token, detectionResult.shouldAutoLogin, detectionResult.userData, platformState.isProcessing, platformParams, dispatch, navigate, performAutoLogin, normalizePhone]);

  // Handle direct chat links (bypass login completely)
  const handleDirectChatAccess = useCallback(() => {
    const pathMatch = location.pathname.match(/^\/user\/chats\/([a-f0-9]{24})$/);
    const isDirectChatLink = pathMatch && platformState.isDetected;

    if (isDirectChatLink && !user && platformState.userData) {
      console.log('🔗 [PlatformDetection] Direct chat link detected, performing auto-login...');
      performAutoLogin(platformState.userData);
      return true;
    }

    return false;
  }, [location.pathname, platformState.isDetected, platformState.userData, user, performAutoLogin]);

  // Manual login trigger for platform users with retry reset
  const triggerPlatformLogin = useCallback(async (customUserData = null) => {
    const userData = customUserData || platformState.userData;
    if (!userData) {
      console.error('❌ [PlatformDetection] No user data available for platform login');
      return false;
    }

    // Reset retry count and set processing state immediately for consistent loading
    setPlatformState(prev => ({ ...prev, isProcessing: true, error: null, retryCount: 0 }));
    
    const result = await performAutoLogin(userData);
    
    // Reset processing state after completion only if failed
    if (!result) {
      setPlatformState(prev => ({ ...prev, isProcessing: false }));
    }
    
    return result;
  }, [platformState.userData, performAutoLogin]);

  // Check if current page should be bypassed for platform users
  const shouldBypassCurrentPage = useCallback(() => {
    const isLoginPage = location.pathname === '/login';
    const isRegisterPage = location.pathname === '/register';
    const shouldBypass = platformState.isDetected && platformState.shouldAutoLogin && (isLoginPage || isRegisterPage);

    if (shouldBypass) {
      console.log('🔄 [PlatformDetection] Bypassing auth page for platform user');
    }

    return shouldBypass;
  }, [location.pathname, platformState.isDetected, platformState.shouldAutoLogin]);

  return {
    // State
    isDetected: detectionResult.isDetected,
    isProcessing: platformState.isProcessing || platformLoading,
    error: platformState.error || platformError,
    userData: platformState.userData || detectionResult.userData,
    shouldAutoLogin: detectionResult.shouldAutoLogin,
    retryCount: platformState.retryCount,

    // Platform parameters
    platformParams,
    isValidApiKey,

    // Actions
    triggerPlatformLogin,
    shouldBypassCurrentPage,

    // Utilities
    isPlatformUser: detectionResult.isDetected,
    hasValidCredentials: !!(detectionResult.userData && isValidApiKey),

    // Status checks
    canAutoLogin: detectionResult.shouldAutoLogin && isValidApiKey,
    isDirectChatAccess: location.pathname.includes('/user/chats/') && detectionResult.isDetected
  };
};
