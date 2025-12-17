import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post } from '../../helper/apiClient';
import { buildUrlWithParams } from '../../helper/helperFunction';
import { chatSocketClient } from '../../sockets/chatSocketClient';
import API from '../../constants/ApiEndpoints';

// ============ ASYNC THUNKS ============

export const fetchRooms = createAsyncThunkHandler(
  'chat/fetchRooms',
  _get,
  (tenantId) => buildUrlWithParams(API.CHAT.ROOMS, { tenantId })
);

export const fetchAdminChatRooms = createAsyncThunkHandler(
  'chat/fetchAdminChatRooms',
  _get,
  API.CHAT.ADMIN_CHAT_ROOMS
);

export const fetchMessages = createAsyncThunkHandler(
  'chat/fetchMessages',
  _get,
  (payload) => buildUrlWithParams(`${API.CHAT.ROOM_MESSAGES}/${payload.roomId}/messages`, { page: payload.page || 1, limit: payload.limit || 50 })
);

export const createOrGetAdminRoom = createAsyncThunkHandler(
  'chat/createOrGetAdminRoom',
  _post,
  API.CHAT.CREATE_OR_GET_ADMIN_ROOM
);

// Socket thunks remain as-is (not API calls)
export const sendMessageThunk = (content) => (dispatch, getState) => {
  const { activeRoomId } = getState().chat;
  const { user } = getState().auth;
  if (!activeRoomId || !user) return;

  const tempMessage = {
    _id: `temp-${Date.now()}`,
    roomId: activeRoomId,
    content,
    senderId: user._id,
    sender: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    },
    createdAt: new Date().toISOString(),
    status: 'sending',
    optimistic: true,
  };

  dispatch(addMessage({ roomId: activeRoomId, message: tempMessage }));
  chatSocketClient.emit('send_message', { roomId: activeRoomId, content });
};

export const joinRoomThunk = (roomId) => async () => {
  try {
    await chatSocketClient.emit('join_room', { roomId });
    await chatSocketClient.emit('mark_room_read', { roomId });
    console.log('✅ Joined room:', roomId);
  } catch (error) {
    console.error('❌ Failed to join room:', error);
  }
};

// ============ INITIAL STATE ============

const initialState = {
  rooms: [],
  activeRoomId: '',
  messagesByRoom: {},
  loadingRooms: false,
  loadingMessages: {},
  error: null,
  onlineUsers: [],
  typingUsers: [],
  messageDeliveryStatus: {},
  userOnlineStatus: {},
  isSendingMessage: false,
  pendingMessageIds: [],
};

// ============ SLICE ============

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom(state, action) {
      state.activeRoomId = action.payload;
      console.log(`🏠 [REDUX] Active room set to: ${action.payload}`);
    },

    addMessage(state, action) {
      const { roomId, message } = action.payload;
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = [];
      }

      const messageWithStatus = {
        ...message,
        status: message.status || 'sending',
        optimistic: message.optimistic !== false,
        createdAt: message.createdAt || new Date().toISOString(),
      };

      state.messagesByRoom[roomId].push(messageWithStatus);
      if (message.optimistic) {
        if (!state.pendingMessageIds.includes(message._id)) {
          state.pendingMessageIds.push(message._id);  // Right method
        }
      }
      console.log(`✅ [REDUX] Message added (optimistic: ${message.optimistic}):`, message._id);
    },

    socketMessageReceived(state, action) {
      const { roomId, message } = action.payload;
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = [];
      }

      const exists = state.messagesByRoom[roomId].some(m => m._id === message._id);
      if (exists) {
        console.log(`⚠️ [REDUX] Duplicate message ignored: ${message._id}`);
        return;
      }

      const now = new Date().getTime();
      state.messagesByRoom[roomId] = state.messagesByRoom[roomId].filter((m) => {
        if (!m.optimistic) return true;
        if (m.content !== message.content) return true;
        const msgTime = new Date(m.createdAt).getTime();
        return now - msgTime > 5000;
      });

      state.messagesByRoom[roomId].push({
        ...message,
        status: message.status || 'delivered',
        optimistic: false,
      });

      state.pendingMessageIds = state.pendingMessageIds.filter(
        id => id !== message._id  // Right method
      );
      console.log(`💬 [REDUX] Real message received: ${message._id}`);
    },

    updateMessageStatus(state, action) {
      const { roomId, messageId, status } = action.payload;
      if (!state.messagesByRoom[roomId]) return;

      const message = state.messagesByRoom[roomId].find(m => m._id === messageId);
      if (message) {
        message.status = status;
        state.messageDeliveryStatus[messageId] = status;
        console.log(`📊 [REDUX] Message status: ${messageId} → ${status}`);
      }
    },

    addTypingUser(state, action) {
      const { userId } = action.payload;
      if (!state.typingUsers.includes(userId)) {
        state.typingUsers.push(userId);
        console.log(`⌨️ [REDUX] User ${userId} typing`);
      }
    },

    removeTypingUser(state, action) {
      const { userId } = action.payload;
      state.typingUsers = state.typingUsers.filter(id => id !== userId);
      console.log(`🛑 [REDUX] User ${userId} stopped typing`);
    },

    clearTypingUsers(state) {
      state.typingUsers = [];
    },

    setOnlineUsers(state, action) {
      state.onlineUsers = action.payload;
      console.log(`👥 [REDUX] Online users: ${action.payload.length}`);
    },

    setUserOnlineStatus(state, action) {
      const { userId, isOnline } = action.payload;
      state.userOnlineStatus[userId] = {
        isOnline,
        lastSeen: new Date().toISOString(),
      };
    },

    updateMessagesReadStatus(state, action) {
      const { roomId, messageIds } = action.payload;
      if (!state.messagesByRoom[roomId]) return;

      messageIds.forEach(messageId => {
        const message = state.messagesByRoom[roomId].find(m => m._id === messageId);
        if (message) {
          message.status = 'read';
          message.readAt = new Date().toISOString();
        }
      });
      console.log(`👁️ [REDUX] Marked ${messageIds.length} messages as read`);
    },

    editMessage(state, action) {
      const { messageId, content } = action.payload;
      for (const roomId in state.messagesByRoom) {
        const message = state.messagesByRoom[roomId].find(m => m._id === messageId);
        if (message) {
          message.content = content;
          message.isEdited = true;
          message.editedAt = new Date().toISOString();
          console.log(`✏️ [REDUX] Message edited: ${messageId}`);
          return;
        }
      }
    },

    deleteMessage(state, action) {
      const { messageId } = action.payload;
      for (const roomId in state.messagesByRoom) {
        const index = state.messagesByRoom[roomId].findIndex(m => m._id === messageId);
        if (index > -1) {
          state.messagesByRoom[roomId][index].deletedAt = new Date().toISOString();
          console.log(`🗑️ [REDUX] Message deleted: ${messageId}`);
          return;
        }
      }
    },

    addReaction(state, action) {
      const { messageId, emoji, userId } = action.payload;
      for (const roomId in state.messagesByRoom) {
        const message = state.messagesByRoom[roomId].find(m => m._id === messageId);
        if (message) {
          if (!message.reactions) message.reactions = [];
          const hasReaction = message.reactions.some(r => r.emoji === emoji && r.userId === userId);
          if (!hasReaction) {
            message.reactions.push({ emoji, userId });
          }
          return;
        }
      }
    },

    removeReaction(state, action) {
      const { messageId, emoji, userId } = action.payload;
      for (const roomId in state.messagesByRoom) {
        const message = state.messagesByRoom[roomId].find(m => m._id === messageId);
        if (message && message.reactions) {
          message.reactions = message.reactions.filter(
            r => !(r.emoji === emoji && r.userId === userId)
          );
          return;
        }
      }
    },

    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.loadingRooms = true;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loadingRooms = false;
        const roomsArray = action.payload?.data?.rooms || action.payload?.rooms || action.payload?.data || [];
        state.rooms = Array.isArray(roomsArray) ? roomsArray : [];
        if (!state.activeRoomId && state.rooms.length > 0) {
          state.activeRoomId = state.rooms[0]._id;
        }
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loadingRooms = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminChatRooms.pending, (state) => {
        state.loadingRooms = true;
      })
      .addCase(fetchAdminChatRooms.fulfilled, (state, action) => {
        state.loadingRooms = false;
        const roomsArray = action.payload?.data?.rooms || action.payload?.rooms || action.payload?.data || [];
        state.rooms = Array.isArray(roomsArray) ? roomsArray : [];
        if (!state.activeRoomId && state.rooms.length > 0) {
          state.activeRoomId = state.rooms[0]._id;
        }
      })

      .addCase(fetchAdminChatRooms.rejected, (state, action) => {
        state.loadingRooms = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state, action) => {
        const roomId = action.meta.arg.roomId;
        state.loadingMessages[roomId] = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const roomId = action.meta.arg.roomId;
        state.loadingMessages[roomId] = false;
        const messages = action.payload?.data?.messages || action.payload?.messages || [];
        state.messagesByRoom[roomId] = Array.isArray(messages) ? messages.map(msg => ({
          ...msg,
          status: msg.status || 'delivered',
          sender: msg.sender || {
            _id: msg.senderId?._id || msg.senderId,
            name: msg.senderId?.name || 'Unknown',
            email: msg.senderId?.email,
            avatar: msg.senderId?.avatar,
            role: msg.senderId?.role,
          },
          optimistic: false,
        })) : [];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const roomId = action.meta.arg.roomId;
        state.loadingMessages[roomId] = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveRoom,
  addMessage,
  socketMessageReceived,
  updateMessageStatus,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
  setOnlineUsers,
  setUserOnlineStatus,
  updateMessagesReadStatus,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
