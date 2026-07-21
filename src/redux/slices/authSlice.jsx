
import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _post, _get, _put } from '../../helper/apiClient';
import { updateProfileWithAvatar } from './userSlice';
import { clearAllAuthTokens, saveAuthTokens } from '../../utils/authUtils';

export const login = createAsyncThunkHandler(
  'auth/login',
  _post,
  '/auth/login'
);

export const fetchMe = createAsyncThunkHandler(
  'auth/fetchMe',
  _get,
  '/auth/me'
);

export const logout = createAsyncThunkHandler(
  'auth/logout',
  _post,
  '/auth/logout'
);

export const changePassword = createAsyncThunkHandler(
  'auth/changePassword',
  _post,
  '/auth/change-password'
);

export const updateProfile = createAsyncThunkHandler(
  'auth/updateProfile',
  _put,
  '/users/profile'
);

// Helper function to clear all auth tokens from localStorage
const clearAuthTokens = () => {
  clearAllAuthTokens();
};

// Helper function to save auth tokens to localStorage  
const saveTokens = (user, token, refreshToken) => {
  saveAuthTokens(user, token, refreshToken);
};

const initialState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
  token: null,
  refreshToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      state.initialized = true;
    },
    setPlatformAuth(state, action) {
      const { user, token, refreshToken } = action.payload;
      // Clear any existing tokens first
      clearAuthTokens();
      
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.initialized = true;
      state.loading = false;
      state.error = null;
      
      // Save new tokens to localStorage
      saveTokens(user, token, refreshToken);
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.initialized = true;
      // Clear localStorage tokens
      clearAuthTokens();
    },
    updateWalletBalance(state, action) {
      if (state.user) {
        state.user.walletBalance = action.payload;
      }
    },
    setInitialized(state) {
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Login fulfilled, full payload:', action.payload);
        // Clear any existing tokens first
        clearAuthTokens();
        
        // action.payload is { success, data: { user, accessToken, refreshToken }, message }
        const { user, accessToken, refreshToken } = action.payload.data || {};
        state.user = user;
        state.token = accessToken;
        state.refreshToken = refreshToken;
        state.initialized = true;
        
        // Save new tokens to localStorage
        saveTokens(user, accessToken, refreshToken);
        
        console.log('Auth state after login:', { user: state.user, token: state.token });
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Me
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.initialized = true;
        state.loading = false;
        // Clear localStorage tokens
        clearAuthTokens();
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout fails, clear local auth state
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.initialized = true;
        state.loading = false;
        // Clear localStorage tokens
        clearAuthTokens();
      })



      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload.data.user };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Profile With Avatar
      .addCase(updateProfileWithAvatar.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload.data.user };
      })

      .addCase('persist/PURGE', () => {
        return initialState;
      });
  },
});

console.log('Auth Slice Initial State:', initialState);

export const { clearError, setUser, setPlatformAuth, clearAuth, updateWalletBalance, setInitialized } = authSlice.actions;

// Auth Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user && !!state.auth.token;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectIsInitialized = (state) => state.auth.initialized;

export default authSlice.reducer;

