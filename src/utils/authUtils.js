/**
 * Authentication token management utilities
 */

/**
 * Clear all authentication tokens from localStorage
 */
export const clearAllAuthTokens = () => {
  const tokensToRemove = [
    'token',
    'refreshToken', 
    'user',
    'persist:auth',
    'persist:root',
    'persist:chat',
    'persist:user'
  ];
  
  tokensToRemove.forEach(token => {
    localStorage.removeItem(token);
  });
  
  console.log('🧹 [AUTH] All authentication tokens cleared from localStorage');
};

/**
 * Save authentication tokens to localStorage
 */
export const saveAuthTokens = (user, token, refreshToken) => {
  try {
    if (token) {
      localStorage.setItem('token', token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    console.log('💾 [AUTH] Authentication tokens saved to localStorage');
  } catch (error) {
    console.error('❌ [AUTH] Failed to save tokens to localStorage:', error);
  }
};

/**
 * Get authentication tokens from localStorage
 */
export const getAuthTokens = () => {
  try {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    return { token, refreshToken, user };
  } catch (error) {
    console.error('❌ [AUTH] Failed to get tokens from localStorage:', error);
    return { token: null, refreshToken: null, user: null };
  }
};

/**
 * Check if user is authenticated based on localStorage tokens
 */
export const isAuthenticated = () => {
  const { token, user } = getAuthTokens();
  return !!(token && user);
};

/**
 * Force logout by clearing all tokens and redirecting to login
 */
export const forceLogout = (reason = 'Session expired') => {
  console.log(`🚪 [AUTH] Force logout: ${reason}`);
  
  // Clear all tokens
  clearAllAuthTokens();
  
  // Show reason if provided
  if (reason !== 'Session expired') {
    alert(reason);
  }
  
  // Redirect to login
  window.location.href = '/login';
};