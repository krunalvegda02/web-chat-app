import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { securityUtils } from '../helper/secureApiClient';

/**
 * Security middleware for frontend applications
 * Handles platform integration security, input validation, and access control
 */

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Input validation
  MAX_INPUT_LENGTH: 1000,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Platform security
  PLATFORM_SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  REQUIRE_HTTPS: import.meta.env.PROD,
  
  // Content Security Policy
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'wss:', 'ws:'],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"]
  }
};

// Rate limiting store
const rateLimitStore = new Map();
const loginAttemptStore = new Map();

/**
 * Security utilities for frontend
 */
export const frontendSecurity = {
  // Input sanitization
  sanitizeInput: (input, maxLength = SECURITY_CONFIG.MAX_INPUT_LENGTH) => {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  },
  
  // Validate file uploads
  validateFile: (file) => {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }
    
    // Check file type
    if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push('Invalid file type. Only images are allowed.');
    }
    
    // Check file size
    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      errors.push('File size too large. Maximum 5MB allowed.');
    }
    
    // Check file name
    if (file.name.length > 255) {
      errors.push('File name too long.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // Rate limiting
  checkRateLimit: (identifier, maxRequests = SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) => {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!rateLimitStore.has(identifier)) {
      rateLimitStore.set(identifier, []);
    }
    
    const requests = rateLimitStore.get(identifier);
    
    // Remove old requests
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    rateLimitStore.set(identifier, recentRequests);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return {
        allowed: false,
        resetTime: Math.ceil((recentRequests[0] + 60000 - now) / 1000)
      };
    }
    
    // Add current request
    recentRequests.push(now);
    rateLimitStore.set(identifier, recentRequests);
    
    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length
    };
  },
  
  // Login attempt tracking
  trackLoginAttempt: (identifier, success = false) => {
    const now = Date.now();
    
    if (!loginAttemptStore.has(identifier)) {
      loginAttemptStore.set(identifier, { attempts: 0, lastAttempt: now, lockedUntil: null });
    }
    
    const record = loginAttemptStore.get(identifier);
    
    if (success) {
      // Reset on successful login
      loginAttemptStore.delete(identifier);
      return { locked: false };
    }
    
    // Check if currently locked
    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        locked: true,
        remainingTime: Math.ceil((record.lockedUntil - now) / 1000)
      };
    }
    
    // Increment attempts
    record.attempts += 1;
    record.lastAttempt = now;
    
    // Lock if too many attempts
    if (record.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = now + SECURITY_CONFIG.LOCKOUT_DURATION;
      return {
        locked: true,
        remainingTime: Math.ceil(SECURITY_CONFIG.LOCKOUT_DURATION / 1000)
      };
    }
    
    loginAttemptStore.set(identifier, record);
    
    return {
      locked: false,
      attemptsRemaining: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - record.attempts
    };
  },
  
  // Platform user validation
  validatePlatformUser: (user) => {
    if (!user) return { isValid: false, errors: ['No user data'] };
    
    const errors = [];
    
    // Check required fields for platform users
    if (user.role === 'USER' && user.platformId) {
      if (!user.email || !securityUtils.isValidEmail(user.email)) {
        errors.push('Valid email is required');
      }
      
      if (!user.phone || !securityUtils.isValidPhone(user.phone)) {
        errors.push('Valid phone number is required');
      }
      
      if (!user.name || user.name.length < 2) {
        errors.push('Valid name is required');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      isPlatformUser: user.role === 'USER' && !!user.platformId,
      isSecurePlatformUser: !!(user.externalUserId && user.platformId)
    };
  },
  
  // Session validation
  validateSession: (user, token) => {
    if (!user || !token) {
      return { isValid: false, reason: 'Missing user or token' };
    }
    
    // Check token expiration (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        return { isValid: false, reason: 'Token expired' };
      }
      
      // Platform user session timeout
      if (user.platformId && payload.iat) {
        const sessionAge = now - payload.iat;
        if (sessionAge > SECURITY_CONFIG.PLATFORM_SESSION_TIMEOUT / 1000) {
          return { isValid: false, reason: 'Platform session expired' };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, reason: 'Invalid token format' };
    }
  },
  
  // Generate secure random ID
  generateSecureId: () => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return Array.from(crypto.getRandomValues(new Uint32Array(4)))
        .map(x => x.toString(16).padStart(8, '0'))
        .join('');
    }
    // Fallback for older browsers
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

/**
 * Security Hook for React components
 */
export const useSecurity = () => {
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  const location = useLocation();
  const navigate = useNavigate();
  const [securityStatus, setSecurityStatus] = useState({
    isSecure: false,
    violations: [],
    platformUser: null
  });
  
  useEffect(() => {
    // Apply security measures
    const violations = [];
    
    // Validate session
    if (user && token) {
      const sessionValidation = frontendSecurity.validateSession(user, token);
      if (!sessionValidation.isValid) {
        violations.push(`Session invalid: ${sessionValidation.reason}`);
        // Redirect to login for invalid sessions
        navigate('/login', { replace: true });
        return;
      }
    }
    
    // Validate platform user
    let platformValidation = null;
    if (user) {
      platformValidation = frontendSecurity.validatePlatformUser(user);
      if (!platformValidation.isValid) {
        violations.push(...platformValidation.errors);
      }
    }
    
    setSecurityStatus({
      isSecure: violations.length === 0,
      violations,
      platformUser: platformValidation
    });
  }, [user, token, location, navigate]);
  
  return {
    securityStatus,
    frontendSecurity,
    
    // Utility functions
    sanitizeInput: frontendSecurity.sanitizeInput,
    validateFile: frontendSecurity.validateFile,
    checkRateLimit: frontendSecurity.checkRateLimit,
    trackLoginAttempt: frontendSecurity.trackLoginAttempt,
    generateSecureId: frontendSecurity.generateSecureId
  };
};

export default frontendSecurity;