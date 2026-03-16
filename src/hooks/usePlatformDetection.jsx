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
    shouldAutoLogin: false
  });

  // Extract platform parameters from URL (memoized to prevent re-renders)
  const platformParams = useMemo(() => (
    {
      apiKey: searchParams.get('apiKey') || searchParams.get('key'),
      name: searchParams.get('name'),
      email: searchParams.get('email'),
      phone: searchParams.get('phone'),
      externalUserId: searchParams.get('userId') || searchParams.get('externalUserId'),
      roomId: searchParams.get('roomId') || searchParams.get('room'),
      autoLogin: searchParams.get('autoLogin') === 'true' || searchParams.get('auto') === 'true',
      redirect: searchParams.get('redirect'),
      platform: searchParams.get('platform')
    }
  ), [searchParams]);

  // Platform integration hook
  const {
    platformChatLogin,
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
    const hasApiKey = !!platformParams.apiKey;
    const hasPlatformParam = !!platformParams.platform;
    const hasUserData = !!(platformParams.name && platformParams.email && platformParams.phone);
    const hasAutoLogin = platformParams.autoLogin;
    const isFromExternalDomain = document.referrer && !document.referrer.includes(window.location.hostname);

    // Only detect platform if we have explicit platform indicators
    const isDetected = hasApiKey || hasPlatformParam || (hasUserData && hasAutoLogin);

    console.log('🔍 [PlatformDetection] Detection analysis:', {
      hasApiKey,
      hasPlatformParam,
      hasUserData,
      hasAutoLogin,
      isFromExternalDomain,
      isDetected,
      email: platformParams.email,
      phone: platformParams.phone
    });

    return {
      isDetected,
      shouldAutoLogin: isDetected && (hasAutoLogin || (hasUserData && isValidApiKey)),
      userData: hasUserData ? {
        name: platformParams.name,
        email: platformParams.email,
        phone: platformParams.phone,
        externalUserId: platformParams.externalUserId || `auto_${Date.now()}`
      } : null
    };
  }, [platformParams, isValidApiKey]);

  // Auto-login function
  const performAutoLogin = useCallback(async (userData) => {
    if (!userData || !isValidApiKey) {
      console.warn('⚠️ [PlatformDetection] Cannot auto-login: missing data or invalid API key');
      return false;
    }

    setPlatformState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      console.log('🔐 [PlatformDetection] Performing auto-login for platform user...', userData);

      const result = await platformChatLogin(userData);

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
          userData: result.data.user
        }));

        return true;
      } else {
        throw new Error(result.error || 'Auto-login failed');
      }
    } catch (error) {
      console.error('❌ [PlatformDetection] Auto-login failed:', error);
      setPlatformState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message
      }));
      return false;
    }
  }, [platformChatLogin, isValidApiKey, platformParams.roomId, dispatch, navigate]);

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
      userPhone: user?.phone
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

  // Manual login trigger for platform users
  const triggerPlatformLogin = useCallback(async (customUserData = null) => {
    const userData = customUserData || platformState.userData;
    if (!userData) {
      console.error('❌ [PlatformDetection] No user data available for platform login');
      return false;
    }

    return await performAutoLogin(userData);
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
