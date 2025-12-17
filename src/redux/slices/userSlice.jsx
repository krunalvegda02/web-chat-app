import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post, _put } from '../../helper/apiClient';

export const updateProfile = createAsyncThunkHandler(
  'user/updateProfile',
  _put,
  '/users/profile'
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

const initialState = {
  profile: null,
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.data;
      })
      .addCase(updateProfile.rejected, (state, action) => {
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
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;