import axios from "axios";
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/v1/";

// Create separate clients for different authentication methods
const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Platform integration client with API key authentication
const platformApiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: false, // Platform integration doesn't use cookies
    headers: {
        "Content-Type": "application/json",
    },
});

// Security headers for all requests
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
};

// Request interceptor for regular API client
apiClient.interceptors.request.use(
    (config) => {
        // Add security headers
        config.headers = { ...config.headers, ...securityHeaders };
        
        // Add auth token from Redux store
        const state = store.getState();
        const token = state.auth?.token;
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle FormData uploads
        if (config.data instanceof FormData) {
            if (config.headers) {
                delete config.headers['Content-Type'];
            }
        }

        // Add request timestamp for security
        config.headers['X-Request-Time'] = Date.now().toString();
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Request interceptor for platform API client
platformApiClient.interceptors.request.use(
    (config) => {
        // Add security headers
        config.headers = { ...config.headers, ...securityHeaders };
        
        // Add platform API key if provided in config
        if (config.platformApiKey) {
            config.headers['X-API-Key'] = config.platformApiKey;
            delete config.platformApiKey; // Remove from config to avoid sending in body
        }

        // Handle FormData uploads
        if (config.data instanceof FormData) {
            if (config.headers) {
                delete config.headers['Content-Type'];
            }
        }

        // Add request timestamp for security
        config.headers['X-Request-Time'] = Date.now().toString();
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a flag to prevent multiple simultaneous logouts
let isLoggingOut = false;

// Response interceptor for regular API client
apiClient.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
            console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data
            });
        }
        return response;
    },
    (error) => {
        // Log errors in development
        if (import.meta.env.DEV) {
            console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
            const currentPath = window.location.pathname;
            const publicPaths = ['/login', '/register', '/join', '/reset-password', '/test-chat'];
            const isPublicPath = publicPaths.some(path => currentPath.includes(path));
            
            // Check if this is a platform user - don't auto-logout platform users
            const state = store.getState();
            const user = state.auth?.user;
            const isPlatformUser = user?.role === 'USER' && user?.platformId;
            const isSecurePlatformUser = user?.externalUserId && user?.platformId;
            
            // Prevent multiple simultaneous logouts and don't logout platform users
            if (!isPublicPath && !isPlatformUser && !isSecurePlatformUser && !isLoggingOut) {
                isLoggingOut = true;
                console.log('⚠️ [API] Authentication error, logging out regular user');
                
                // Clear auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('persist:root');
                
                // Dispatch logout action
                store.dispatch(logout());
                
                // Reset flag after a delay
                setTimeout(() => {
                    isLoggingOut = false;
                }, 1000);
                
                // Redirect to login
                window.location.href = '/login';
            } else if (isPlatformUser || isSecurePlatformUser) {
                console.log('⚠️ [API] Authentication error for platform user, not auto-logging out');
            }
        }
        
        return Promise.reject(error);
    }
);

// Response interceptor for platform API client
platformApiClient.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
            console.log(`✅ Platform API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data
            });
        }
        return response;
    },
    (error) => {
        // Log errors in development
        if (import.meta.env.DEV) {
            console.error(`❌ Platform API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
            console.warn('🚫 Rate limit exceeded. Please try again later.');
        }
        
        return Promise.reject(error);
    }
);

// Regular API methods
const _get = (url, data = {}, config = {}) => {
    return apiClient.get(url, { ...config, params: data });
};

const _delete = (url, data = {}, config = {}) => {
    return apiClient.delete(url, { ...config, data });
};

const _patch = (url, data = {}, config = {}) => {
    return apiClient.patch(url, data, config);
};

const _post = (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
};

const _put = (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
};

// Platform integration API methods
const platformApi = {
    // Secure platform chat login
    chatLogin: (userData, apiKey) => {
        return platformApiClient.post('/platforms/integration/chat-login', userData, {
            platformApiKey: apiKey
        });
    },
    
    // Get user by external ID
    getUserByExternalId: (externalUserId, apiKey) => {
        return platformApiClient.get(`/platforms/integration/users/external/${externalUserId}`, {
            platformApiKey: apiKey
        });
    },
    
    // Update platform user
    updateUser: (userId, userData, apiKey) => {
        return platformApiClient.put(`/platforms/integration/users/${userId}`, userData, {
            platformApiKey: apiKey
        });
    },
    
    // Get platform statistics
    getStats: (apiKey) => {
        return platformApiClient.get('/platforms/integration/stats', {
            platformApiKey: apiKey
        });
    },
    
    // Send webhook
    webhook: (eventData, apiKey) => {
        return platformApiClient.post('/platforms/integration/webhook', eventData, {
            platformApiKey: apiKey
        });
    },

    // Consume session token (no API key needed — token is single-use, short-lived)
    consumeSessionToken: (sessionToken) => {
        return platformApiClient.post('/platforms/session-login', { sessionToken });
    },

    // Generate session token (server-to-server: API key → session token)
    generateSessionToken: (userData, apiKey) => {
        return platformApiClient.post('/platforms/session-token', userData, {
            platformApiKey: apiKey
        });
    },
};

// Security utilities
const securityUtils = {
    // Validate API key format
    isValidApiKey: (apiKey) => {
        if (typeof apiKey !== 'string') return false;
        return apiKey.startsWith('pk_') && apiKey.length > 10;
    },
    
    // Sanitize user input
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    },
    
    // Validate email format
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate phone format
    isValidPhone: (phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone.length >= 10 && cleanPhone.length <= 15;
    },
    
    // Generate secure random string
    generateSecureId: () => {
        return crypto.getRandomValues(new Uint32Array(4)).join('');
    }
};

// Enhanced error handling
const handleApiError = (error, context = '') => {
    const errorInfo = {
        context,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
    };
    
    // Log error for debugging
    console.error(`API Error ${context}:`, errorInfo);
    
    // Return user-friendly error message
    switch (error.response?.status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Authentication failed. Please login again.';
        case 403:
            return 'Access denied. You don\'t have permission.';
        case 404:
            return 'Resource not found.';
        case 429:
            return 'Too many requests. Please try again later.';
        case 500:
            return 'Server error. Please try again later.';
        default:
            return error.response?.data?.message || 'An unexpected error occurred.';
    }
};

// Export everything
export { 
    _delete, 
    _get, 
    _post, 
    _patch, 
    _put,
    platformApi,
    securityUtils,
    handleApiError,
    apiClient,
    platformApiClient
};