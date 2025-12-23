import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _post } from '../../helper/apiClient';

export const registerFCMToken = createAsyncThunkHandler(
  'notification/registerToken',
  _post,
  'notifications/register-token'
);

export const unregisterFCMToken = createAsyncThunkHandler(
  'notification/unregisterToken',
  _post,
  'notifications/unregister-token'
);

const initialState = {
  fcmToken: null,
  permission: 'default',
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setFCMToken(state, action) {
      state.fcmToken = action.payload;
    },
    setPermission(state, action) {
      state.permission = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerFCMToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerFCMToken.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ FCM token registered successfully');
      })
      .addCase(registerFCMToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('❌ FCM token registration failed:', action.payload);
      })
      .addCase(unregisterFCMToken.fulfilled, (state) => {
        state.fcmToken = null;
        console.log('✅ FCM token unregistered');
      });
  },
});

export const { setFCMToken, setPermission, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;
