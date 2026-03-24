import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { platformApi, securityUtils, handleApiError } from '../helper/secureApiClient';
import { setUser } from '../redux/slices/authSlice';
import store from '../redux/store';

/**
 * Custom hook for secure platform integration
 * Provides methods for platform authentication and user management
 */
export const usePlatformIntegration = (apiKey = null) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValidApiKey, setIsValidApiKey] = useState(false);

  // Validate API key on mount and when it changes
  useEffect(() => {
    if (apiKey) {
      const valid = securityUtils.isValidApiKey(apiKey);
      setIsValidApiKey(valid);
      if (!valid) {
        setError('Invalid API key format');
      } else {
        setError(null);
      }
    } else {
      setIsValidApiKey(false);
    }
  }, [apiKey]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Consume session token (browser calls this — no API key needed)
  const consumeSessionToken = useCallback(async (sessionToken) => {
    if (!sessionToken) return { success: false, error: 'Session token is required' };
    setLoading(true);
    setError(null);
    try {
      const response = await platformApi.consumeSessionToken(sessionToken);
      if (response.data.success) {
        const { user, accessToken, refreshToken, room } = response.data.data;
        const authPayload = { user, token: accessToken, refreshToken, initialized: true, loading: false, error: null };
        localStorage.setItem('persist:root', JSON.stringify({
          auth: JSON.stringify(authPayload),
          _persist: JSON.stringify({ version: -1, rehydrated: true })
        }));
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        dispatch(setUser(user));
        store.dispatch({ type: 'auth/setPlatformAuth', payload: authPayload });
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Session login failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Consume Session Token');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Secure platform chat login
  const platformChatLogin = useCallback(async (userData, platformName = null) => {
    if (!isValidApiKey) {
      setError('Valid API key is required');
      return { success: false, error: 'Valid API key is required' };
    }

    // Validate required fields
    if (!userData.email || !userData.phone) {
      setError('Email and phone are required');
      return { success: false, error: 'Email and phone are required' };
    }

    // Validate email format
    if (!securityUtils.isValidEmail(userData.email)) {
      setError('Invalid email format');
      return { success: false, error: 'Invalid email format' };
    }

    // Validate phone format
    if (!securityUtils.isValidPhone(userData.phone)) {
      setError('Invalid phone format');
      return { success: false, error: 'Invalid phone format' };
    }

    setLoading(true);
    setError(null);

    try {
      // Sanitize input data
      const sanitizedData = {
        name: userData.name ? securityUtils.sanitizeInput(userData.name) : undefined,
        email: securityUtils.sanitizeInput(userData.email),
        phone: securityUtils.sanitizeInput(userData.phone),
        password: userData.password,
        externalUserId: userData.externalUserId ? securityUtils.sanitizeInput(userData.externalUserId) : undefined
      };

      // Add platform name if provided (for test API key)
      if (platformName) {
        sanitizedData.platformName = securityUtils.sanitizeInput(platformName);
      }

      console.log('🔐 [PlatformIntegration] Initiating secure login...');
      
      const response = await platformApi.chatLogin(sanitizedData, apiKey);
      
      if (response.data.success) {
        const { user, accessToken, refreshToken, room, platform } = response.data.data;
        
        // Store authentication data securely
        const authState = {
          user,
          loading: false,
          error: null,
          initialized: true,
          token: accessToken,
          refreshToken,
          inviteInfo: null,
          inviteLoading: false,
          inviteError: null,
        };

        // Store in Redux persist format
        const persistState = {
          auth: JSON.stringify(authState),
          _persist: JSON.stringify({
            version: -1,
            rehydrated: true
          })
        };
        localStorage.setItem('persist:root', JSON.stringify(persistState));
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Update Redux state with both user and token
        dispatch(setUser(user));
        
        // Also dispatch a custom action to set the token
        // Since we don't have a setToken action, we'll use the login fulfilled pattern
        const authPayload = {
          user,
          token: accessToken,
          refreshToken,
          initialized: true,
          loading: false,
          error: null
        };
        
        // Update the entire auth state
        const authAction = { 
          type: 'auth/setPlatformAuth', 
          payload: authPayload 
        };
        
        console.log('🔄 [PlatformIntegration] Dispatching auth action:', authAction);
        store.dispatch(authAction);
        
        // Verify the state was updated
        const newState = store.getState().auth;
        console.log('✅ [PlatformIntegration] Auth state after dispatch:', {
          user: !!newState.user,
          token: !!newState.token,
          initialized: newState.initialized
        });

        console.log('✅ [PlatformIntegration] Login successful');

        return {
          success: true,
          data: {
            user,
            accessToken,
            refreshToken,
            room,
            platform,
            redirectUrl: response.data.data.redirectUrl
          }
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Platform Chat Login');
      setError(errorMessage);
      console.error('❌ [PlatformIntegration] Login failed:', errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiKey, isValidApiKey, dispatch]);

  // Get user by external ID
  const getUserByExternalId = useCallback(async (externalUserId) => {
    if (!isValidApiKey) {
      setError('Valid API key is required');
      return { success: false, error: 'Valid API key is required' };
    }

    if (!externalUserId) {
      setError('External user ID is required');
      return { success: false, error: 'External user ID is required' };
    }

    setLoading(true);
    setError(null);

    try {
      const sanitizedId = securityUtils.sanitizeInput(externalUserId);
      const response = await platformApi.getUserByExternalId(sanitizedId, apiKey);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to get user');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Get User by External ID');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiKey, isValidApiKey]);

  // Update platform user
  const updatePlatformUser = useCallback(async (userId, userData) => {
    if (!isValidApiKey) {
      setError('Valid API key is required');
      return { success: false, error: 'Valid API key is required' };
    }

    if (!userId) {
      setError('User ID is required');
      return { success: false, error: 'User ID is required' };
    }

    setLoading(true);
    setError(null);

    try {
      // Sanitize input data
      const sanitizedData = {};
      if (userData.name) sanitizedData.name = securityUtils.sanitizeInput(userData.name);
      if (userData.phone) sanitizedData.phone = securityUtils.sanitizeInput(userData.phone);
      if (userData.avatar) sanitizedData.avatar = securityUtils.sanitizeInput(userData.avatar);
      if (userData.status) sanitizedData.status = userData.status;

      const response = await platformApi.updateUser(userId, sanitizedData, apiKey);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Update Platform User');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiKey, isValidApiKey]);

  // Get platform statistics
  const getPlatformStats = useCallback(async () => {
    if (!isValidApiKey) {
      setError('Valid API key is required');
      return { success: false, error: 'Valid API key is required' };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await platformApi.getStats(apiKey);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to get stats');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Get Platform Stats');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiKey, isValidApiKey]);

  // Send webhook event
  const sendWebhookEvent = useCallback(async (event, data) => {
    if (!isValidApiKey) {
      setError('Valid API key is required');
      return { success: false, error: 'Valid API key is required' };
    }

    if (!event || !data) {
      setError('Event and data are required');
      return { success: false, error: 'Event and data are required' };
    }

    setLoading(true);
    setError(null);

    try {
      const eventData = { event, data };
      const response = await platformApi.webhook(eventData, apiKey);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Webhook failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Send Webhook Event');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiKey, isValidApiKey]);

  // Validate user data format
  const validateUserData = useCallback((userData) => {
    const errors = [];

    if (!userData.email) {
      errors.push('Email is required');
    } else if (!securityUtils.isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    if (!userData.phone) {
      errors.push('Phone is required');
    } else if (!securityUtils.isValidPhone(userData.phone)) {
      errors.push('Invalid phone format');
    }

    if (userData.name && userData.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    // State
    loading,
    error,
    isValidApiKey,
    
    // Methods
    platformChatLogin,
    consumeSessionToken,
    getUserByExternalId,
    updatePlatformUser,
    getPlatformStats,
    sendWebhookEvent,
    validateUserData,
    clearError,
    
    // Utilities
    securityUtils
  };
};