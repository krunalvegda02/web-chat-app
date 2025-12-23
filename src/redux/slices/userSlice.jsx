import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post, _put, _delete } from '../../helper/apiClient';

export const getUserById = createAsyncThunkHandler(
  'user/getUserById',
  _get,
  (userId) => `/users/${userId}`
);

export const updateProfile = createAsyncThunkHandler(
  'user/updateProfile',
  _put,
  '/users/profile',
  true // isMultipart for avatar upload
);

export const updateProfileWithAvatar = createAsyncThunkHandler(
  'user/updateProfileWithAvatar',
  _put,
  '/users/profile',
  true // isMultipart
);

export const uploadAvatar = createAsyncThunkHandler(
  'user/uploadAvatar',
  _post,
  '/users/avatar',
  true // isMultipart
);

export const getNotifications = createAsyncThunkHandler(
  'user/getNotifications',
  _get,
  '/users/notifications'
);

export const markNotificationAsRead = createAsyncThunkHandler(
  'user/markNotificationAsRead',
  _put,
  (payload) => `/users/notifications/${payload}`
);

export const addContact = createAsyncThunkHandler(
  'user/addContact',
  _post,
  '/contacts'
);

export const removeContact = createAsyncThunkHandler(
  'user/removeContact',
  _delete,
  (userId) => `/contacts/${userId}`
);

export const toggleFavorite = createAsyncThunkHandler(
  'user/toggleFavorite',
  _post,
  (payload) => `/contacts/${payload.userId}/${payload.isFavorite ? 'unfavorite' : 'favorite'}`
);

export const blockUser = createAsyncThunkHandler(
  'user/blockUser',
  _post,
  (userId) => `/users/block/${userId}`
);

export const unblockUser = createAsyncThunkHandler(
  'user/unblockUser',
  _post,
  (userId) => `/users/unblock/${userId}`
);

const initialState = {
  profile: null,
  viewedUser: null,
  notifications: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearViewedUser(state) {
      state.viewedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.viewedUser = action.payload.data;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.data.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfileWithAvatar.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfileWithAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.data.user;
      })
      .addCase(updateProfileWithAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.avatar = action.payload.data.avatar;
        }
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.data;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notificationId = action.meta.arg;
        const notification = state.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.read = true;
        }
      })
      .addCase(addContact.fulfilled, (state) => {
        if (state.viewedUser) {
          state.viewedUser.isContact = true;
        }
      })
      .addCase(removeContact.fulfilled, (state) => {
        if (state.viewedUser) {
          state.viewedUser.isContact = false;
          state.viewedUser.isFavorite = false;
        }
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        if (state.viewedUser) {
          state.viewedUser.isFavorite = !state.viewedUser.isFavorite;
        }
      })
      .addCase(blockUser.fulfilled, (state) => {
        if (state.viewedUser) {
          state.viewedUser.isBlocked = true;
        }
      })
      .addCase(unblockUser.fulfilled, (state) => {
        if (state.viewedUser) {
          state.viewedUser.isBlocked = false;
        }
      });
  },
});

export const { clearError, clearViewedUser } = userSlice.actions;
export default userSlice.reducer;