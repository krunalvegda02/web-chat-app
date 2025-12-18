
import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _post, _get } from '../../helper/apiClient';

export const login = createAsyncThunkHandler(
  'auth/login',
  _post,
  '/auth/login'
);

export const register = createAsyncThunkHandler(
  'auth/register',
  _post,
  '/auth/register'
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

export const forgotPassword = createAsyncThunkHandler(
  'auth/forgotPassword',
  _post,
  '/auth/forgot-password'
);

export const resetPassword = createAsyncThunkHandler(
  'auth/resetPassword',
  _post,
  '/auth/reset-password'
);

export const fetchInviteInfo = createAsyncThunkHandler(
  'auth/fetchInviteInfo',
  _get,
  (payload) => `/auth/invite-info?token=${payload.token}&tenantId=${payload.tenantId}`
);

export const registerWithInvite = createAsyncThunkHandler(
  'auth/registerWithInvite',
  _post,
  '/auth/register-with-invite'
);

const initialState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
  token: null,
  refreshToken: null,
  inviteInfo: null,
  inviteLoading: false,
  inviteError: null,
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
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.initialized = true;
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
        state.user = action.payload.data.user;
        state.token = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.initialized = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true;
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
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.initialized = true;
      })

      // Fetch Invite Info
      .addCase(fetchInviteInfo.pending, (state) => {
        state.inviteLoading = true;
        state.inviteError = null;
      })
      .addCase(fetchInviteInfo.fulfilled, (state, action) => {
        state.inviteLoading = false;
        state.inviteInfo = action.payload.data;
      })
      .addCase(fetchInviteInfo.rejected, (state, action) => {
        state.inviteLoading = false;
        state.inviteError = action.payload;
      })

      // Register with Invite
      .addCase(registerWithInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerWithInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.initialized = true;
      })
      .addCase(registerWithInvite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase('persist/PURGE', () => {
        return initialState;
      });
  },
});

console.log('Auth Slice Initial State:', initialState);

export const { clearError, setUser, clearAuth, setInitialized } = authSlice.actions;

// Auth Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user && !!state.auth.token;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectIsInitialized = (state) => state.auth.initialized;

export default authSlice.reducer;

