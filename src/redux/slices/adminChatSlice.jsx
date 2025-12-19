import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get } from '../../helper/apiClient';
import { buildUrlWithParams } from '../../helper/helperFunction';
import API from '../../constants/ApiEndpoints';

export const fetchAdminMemberChats = createAsyncThunkHandler(
  'adminChat/fetchMemberChats',
  _get,
  (payload) => buildUrlWithParams(API.CHAT.ADMIN_MEMBER_CHATS, payload)
);

export const fetchSpecificMemberChats = createAsyncThunkHandler(
  'adminChat/fetchSpecificMemberChats',
  _get,
  (payload) => API.CHAT.SPECIFIC_MEMBER_CHATS.replace(':memberId', payload.memberId)
);

export const fetchMemberChatHistory = createAsyncThunkHandler(
  'adminChat/fetchMemberChatHistory',
  _get,
  (payload) => API.CHAT.MEMBER_CHAT_HISTORY
    .replace(':memberId', payload.memberId)
    .replace(':roomId', payload.roomId)
);

const initialState = {
  members: [],
  memberChats: [],
  messages: [],
  loading: false,
  chatsLoading: false,
  messagesLoading: false,
  error: null,
};

const adminChatSlice = createSlice({
  name: 'adminChat',
  initialState,
  reducers: {
    clearMessages(state) {
      state.messages = [];
    },
    clearMemberChats(state) {
      state.memberChats = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMemberChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminMemberChats.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload.data?.memberChats || [];
      })
      .addCase(fetchAdminMemberChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSpecificMemberChats.pending, (state) => {
        state.chatsLoading = true;
      })
      .addCase(fetchSpecificMemberChats.fulfilled, (state, action) => {
        state.chatsLoading = false;
        state.memberChats = action.payload.data?.chats || [];
      })
      .addCase(fetchSpecificMemberChats.rejected, (state, action) => {
        state.chatsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMemberChatHistory.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(fetchMemberChatHistory.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload.data?.messages || [];
      })
      .addCase(fetchMemberChatHistory.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessages, clearMemberChats, clearError } = adminChatSlice.actions;
export default adminChatSlice.reducer;
