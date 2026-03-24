import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post, _put, _delete, _patch } from '../../helper/apiClient';
import { buildUrlWithParams } from '../../helper/helperFunction';

// Platform Management (Super Admin)
export const getAllPlatforms = createAsyncThunkHandler(
  'platform/getAllPlatforms',
  _get,
  (payload) => buildUrlWithParams('/platforms', payload)
);

export const createPlatform = createAsyncThunkHandler(
  'platform/createPlatform',
  _post,
  '/platforms'
);

export const getPlatformById = createAsyncThunkHandler(
  'platform/getPlatformById',
  _get,
  (payload) => `/platforms/${payload}`
);

export const updatePlatform = createAsyncThunkHandler(
  'platform/updatePlatform',
  _put,
  (payload) => `/platforms/${payload.id}`
);

export const togglePlatformStatus = createAsyncThunkHandler(
  'platform/togglePlatformStatus',
  _patch,
  (payload) => `/platforms/${payload}/toggle-status`
);

export const deletePlatform = createAsyncThunkHandler(
  'platform/deletePlatform',
  _delete,
  (payload) => `/platforms/${payload}`
);

// Get or Create Chat Room (External Platform Integration)
export const getPlatformUsers = createAsyncThunkHandler(
  'platform/getPlatformUsers',
  _get,
  (payload) => buildUrlWithParams(`/platforms/${payload.platformId}/users`, {
    page: payload.page,
    limit: payload.limit,
    search: payload.search,
    status: payload.status
  })
);

export const getUserById = createAsyncThunkHandler(
  'platform/getUserById',
  _get,
  (payload) => `/platforms/users/${payload}`
);

export const updateUserStatus = createAsyncThunkHandler(
  'platform/updateUserStatus',
  _patch,
  (payload) => `/platforms/users/${payload.userId}/status`
);

export const generateApiKey = createAsyncThunkHandler(
  'platform/generateApiKey',
  _post,
  (payload) => `/platforms/${payload}/api-key/generate`
);

export const getApiKey = createAsyncThunkHandler(
  'platform/getApiKey',
  _get,
  (payload) => `/platforms/${payload}/api-key`
);

const initialState = {
  platforms: [],
  currentPlatform: null,
  platformUsers: [],
  currentUser: null,
  loading: false,
  error: null,
  newPlatformApiKey: null,
  platformApiKey: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearCurrentPlatform(state) {
      state.currentPlatform = null;
    },
    clearPlatformUsers(state) {
      state.platformUsers = [];
    },
    clearNewPlatformApiKey(state) {
      state.newPlatformApiKey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Platforms
      .addCase(getAllPlatforms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPlatforms.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.platforms = Array.isArray(data) ? data : data?.platforms || [];
        if (data?.pagination) {
          state.pagination = data.pagination;
        }
      })
      .addCase(getAllPlatforms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Platform
      .addCase(createPlatform.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlatform.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data?.platform || action.payload.data;
        const { apiKey, ...platformData } = data || {};
        if (!Array.isArray(state.platforms)) {
          state.platforms = [];
        }
        state.platforms.unshift(platformData);
        if (apiKey) state.newPlatformApiKey = apiKey;
      })
      .addCase(createPlatform.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Platform By ID
      .addCase(getPlatformById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPlatformById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlatform = action.payload.data?.platform || action.payload.data;
      })
      .addCase(getPlatformById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Platform
      .addCase(updatePlatform.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlatform.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPlatform = action.payload.data?.platform || action.payload.data;
        const index = state.platforms.findIndex(p => p._id === updatedPlatform._id);
        if (index !== -1) {
          state.platforms[index] = updatedPlatform;
        }
        if (state.currentPlatform?._id === updatedPlatform._id) {
          state.currentPlatform = updatedPlatform;
        }
      })
      .addCase(updatePlatform.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle Platform Status
      .addCase(togglePlatformStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(togglePlatformStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPlatform = action.payload.data?.platform || action.payload.data;
        const index = state.platforms.findIndex(p => p._id === updatedPlatform._id);
        if (index !== -1) {
          state.platforms[index] = updatedPlatform;
        }
      })
      .addCase(togglePlatformStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Platform
      .addCase(deletePlatform.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlatform.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.meta.arg;
        state.platforms = state.platforms.filter(p => p._id !== deletedId);
      })
      .addCase(deletePlatform.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Platform Users
      .addCase(getPlatformUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPlatformUsers.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.platformUsers = data?.users || [];
        if (data?.pagination) {
          state.pagination = data.pagination;
        }
      })
      .addCase(getPlatformUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get User By ID
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.data?.user || action.payload.data;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update User Status
      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload.data?.user || action.payload.data;
        const index = state.platformUsers.findIndex(u => u._id === updatedUser._id);
        if (index !== -1) {
          state.platformUsers[index] = updatedUser;
        }
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get API Key
      .addCase(getApiKey.fulfilled, (state, action) => {
        const data = action.payload.data;
        state.platformApiKey = data?.apiKey || (data?.hasApiKey ? 'legacy' : null);
      })

      // Generate API Key
      .addCase(generateApiKey.fulfilled, (state, action) => {
        state.platformApiKey = action.payload.data?.apiKey || null;
      });
  },
});

export const { clearError, clearCurrentPlatform, clearPlatformUsers, clearNewPlatformApiKey } = platformSlice.actions;
export default platformSlice.reducer;
