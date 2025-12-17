import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post } from '../../helper/apiClient';
import { buildUrlWithParams } from '../../helper/helperFunction';
import { chatSocketClient } from '../../sockets/chatSocketClient';

// ============ THUNKS ============
export const fetchRooms = createAsyncThunkHandler(
  'chat/fetchRooms',
  _get,
  (payload) => buildUrlWithParams('/chat/rooms', { tenantId: payload })
);

export const fetchAdminRooms = createAsyncThunkHandler(
  'chat/fetchAdminRooms',
  _get,
  '/chat/admin-rooms'
);

export const fetchAdminChatRooms = createAsyncThunkHandler(
  'chat/fetchAdminChatRooms',
  _get,
  '/chat/admin-chat-rooms'
);

// ✅ NEW THUNK: Fetch rooms based on user role
export const fetchRoomsByRole = createAsyncThunkHandler(
  'chat/fetchRoomsByRole',
  _get,
  '/chat/rooms-by-role'
);

// ✅ UPDATED THUNK: Create or get admin room
export const createOrGetAdminRoom = createAsyncThunkHandler(
  'chat/createOrGetAdminRoom',
  _post,
  '/chat/admin-room'
);

export const createAdminRoom = createAsyncThunkHandler(
  'chat/createAdminRoom',
  _post,
  '/chat/admin-rooms'
);

export const fetchMessages = createAsyncThunkHandler(
  'chat/fetchMessages',
  _get,
  (payload) => buildUrlWithParams(`/chat/rooms/${payload.roomId}/messages`, { page: payload.page || 1, limit: payload.limit || 50 })
);

export const searchMessages = createAsyncThunkHandler(
  'chat/searchMessages',
  _get,
  (payload) => buildUrlWithParams(`/chat/rooms/${payload.roomId}/search`, { query: payload.query })
);

export const getAllChats = createAsyncThunkHandler(
  'chat/getAllChats',
  _get,
  (payload) => buildUrlWithParams('/chat/all-chats', payload)
);

export const createRoom = createAsyncThunkHandler(
  'chat/createRoom',
  _post,
  '/chat/rooms'
);

export const markAsRead = createAsyncThunkHandler(
  'chat/markAsRead',
  _post,
  (roomId) => ({ url: `/chat/rooms/${roomId}/mark-as-read`, data: {} })
);

// ============ INITIAL STATE ============
const initialState = {
  rooms: [],
  allChats: [],
  activeRoomId: '',
  messagesByRoom: {},
  searchResults: [],
  loadingRooms: false,
  loadingMessages: {},
  loadingChats: false,
  error: null,
  onlineUsers: [],
  typingUsers: [],
  userOnlineStatus: {}, // ✅ NEW: Track online status per user
  messageDeliveryStatus: {}, // ✅ NEW: Track message delivery
};

// ============ SLICE ============
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom(state, action) {
      state.activeRoomId = action.payload;
    },

    // ✅ IMPROVED: Add message with delivery status
    addMessage(state, action) {
      const { roomId, message } = action.payload;
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = [];
      }
      const messageWithDelivery = {
        ...message,
        status: message.status || 'sent', // sent, delivered, read
        sentAt: message.sentAt || new Date().toISOString(),
        deliveredAt: null,
        readAt: null,
        readBy: [],
      };
      state.messagesByRoom[roomId].push(messageWithDelivery);
    },

    socketMessageReceived(state, action) {
      const { roomId, message } = action.payload;
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = [];
      }

      // Check if message already exists
      const exists = state.messagesByRoom[roomId].some(m => m._id === message._id);
      if (exists) return;

      // Remove optimistic message with same content (within last 5 seconds)
      const now = new Date().getTime();
      state.messagesByRoom[roomId] = state.messagesByRoom[roomId].filter(
        (m) => {
          if (!m.optimistic) return true;
          if (m.content !== message.content) return true;
          const msgTime = new Date(m.createdAt).getTime();
          return (now - msgTime) > 5000; // Keep if older than 5 seconds
        }
      );

      // Add real message
      state.messagesByRoom[roomId].push({
        ...message,
        status: 'delivered',
        optimistic: false,
      });
    },

    // ✅ NEW: Update message delivery status
    updateMessageDeliveryStatus(state, action) {
      const { roomId, messageId, status, timestamp } = action.payload;
      if (!state.messagesByRoom[roomId]) return;

      const messageIndex = state.messagesByRoom[roomId].findIndex(m => m._id === messageId);
      if (messageIndex > -1) {
        const message = state.messagesByRoom[roomId][messageIndex];
        message.status = status; // sent, delivered, read

        if (status === 'delivered') {
          message.deliveredAt = timestamp;
        } else if (status === 'read') {
          message.readAt = timestamp;
        }
      }
    },

    // ✅ NEW: Update user online status
    setUserOnlineStatus(state, action) {
      const { userId, isOnline } = action.payload;
      state.userOnlineStatus[userId] = {
        isOnline,
        lastSeen: new Date().toISOString(),
      };
    },

    // ✅ NEW: Batch update online users
    setOnlineUsers(state, action) {
      state.onlineUsers = action.payload;
      // Also update individual status
      action.payload.forEach(userId => {
        state.userOnlineStatus[userId] = {
          isOnline: true,
          lastSeen: new Date().toISOString(),
        };
      });
    },

    addTypingUser: (state, action) => {
      const { userId } = action.payload;
      if (!state.typingUsers.includes(userId)) {
        state.typingUsers.push(userId);
      }
    },

    removeTypingUser: (state, action) => {
      const { userId } = action.payload;
      state.typingUsers = state.typingUsers.filter(id => id !== userId);
    },

    clearTypingUsers: (state) => {
      state.typingUsers = [];
    },

    // ✅ IMPROVED: Update all messages read status
    updateMessagesReadStatus: (state, action) => {
      const { roomId, messages } = action.payload;
      if (state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = messages;
      }
    },

    clearSearchResults(state) {
      state.searchResults = [];
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
        if (!state.activeRoomId && state.rooms.length) {
          state.activeRoomId = state.rooms._id;
        }
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loadingRooms = false;
        state.error = action.payload;
        state.rooms = [];
      })

      .addCase(fetchAdminRooms.pending, (state) => {
        state.loadingRooms = true;
      })
      .addCase(fetchAdminRooms.fulfilled, (state, action) => {
        state.loadingRooms = false;
        const roomsArray = action.payload?.data?.rooms || action.payload?.rooms || action.payload?.data || [];
        state.rooms = Array.isArray(roomsArray) ? roomsArray : [];
        if (!state.activeRoomId && state.rooms.length) {
          state.activeRoomId = state.rooms._id;
        }
      })
      .addCase(fetchAdminRooms.rejected, (state, action) => {
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
        if (!state.activeRoomId && state.rooms.length) {
          state.activeRoomId = state.rooms._id;
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
        const validMessages = Array.isArray(messages)
          ? messages.map(msg => ({
              ...msg,
              status: msg.status || 'delivered',
              sender: msg.sender || {
                _id: msg.senderId?._id || msg.senderId,
                name: msg.senderId?.name || 'Unknown',
                email: msg.senderId?.email,
                avatar: msg.senderId?.avatar,
                role: msg.senderId?.role,
              },
            }))
          : [];
        state.messagesByRoom[roomId] = validMessages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const roomId = action.meta.arg.roomId;
        state.loadingMessages[roomId] = false;
        state.error = action.payload;
      })

      .addCase(searchMessages.pending, (state) => {
        state.loadingMessages['search'] = true;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.loadingMessages['search'] = false;
        state.searchResults = action.payload?.results || [];
      })
      .addCase(searchMessages.rejected, (state) => {
        state.loadingMessages['search'] = false;
      })

      .addCase(getAllChats.pending, (state) => {
        state.loadingChats = true;
      })
      .addCase(getAllChats.fulfilled, (state, action) => {
        state.loadingChats = false;
        const roomsArray = action.payload?.data?.rooms || action.payload?.rooms || action.payload?.data || [];
        state.allChats = Array.isArray(roomsArray) ? roomsArray : [];
      })
      .addCase(getAllChats.rejected, (state, action) => {
        state.loadingChats = false;
        state.error = action.payload;
      })

      .addCase(createRoom.fulfilled, (state, action) => {
        const newRoom = action.payload?.data?.room || action.payload?.room || action.payload?.data;
        if (newRoom && state.rooms) {
          state.rooms.unshift(newRoom);
          state.activeRoomId = newRoom._id;
        }
      })

      .addCase(markAsRead.fulfilled, (state) => {
        // Mark messages as read on backend
      });

builder
  .addCase(fetchRoomsByRole.pending, (state) => {
    state.loadingRooms = true;
  })
  .addCase(fetchRoomsByRole.fulfilled, (state, action) => {
    state.loadingRooms = false;
    const roomsArray = action.payload?.data?.rooms || action.payload?.rooms || [];
    state.rooms = Array.isArray(roomsArray) ? roomsArray : [];
    if (!state.activeRoomId && state.rooms.length) {
      state.activeRoomId = state.rooms._id;
    }
  })
  .addCase(fetchRoomsByRole.rejected, (state, action) => {
    state.loadingRooms = false;
    state.error = action.payload;
    state.rooms = [];
  })
  .addCase(createOrGetAdminRoom.fulfilled, (state, action) => {
    const room = action.payload?.data?.room || action.payload?.room;
    if (room) {
      const existingIndex = state.rooms.findIndex(r => r._id === room._id);
      if (existingIndex > -1) {
        state.rooms[existingIndex] = room;
      } else {
        state.rooms.unshift(room);
      }
      state.activeRoomId = room._id;
    }
  });
  },
});

// ============ THUNK: Join Room ============
export const joinRoomThunk = (roomId) => async (dispatch, getState) => {
  try {
    // Join room and mark as read
    await chatSocketClient.emit('join_room', { roomId });
    await chatSocketClient.emit('mark_room_read', { roomId });
    console.log('✅ Joined room:', roomId);

  } catch (error) {
    console.error('❌ Failed to join room:', error);
  }
};

// ============ THUNK: Send Message ============
export const sendMessageThunk = (content) => async (dispatch, getState) => {
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

  try {
    await chatSocketClient.emit('send_message', {
      roomId: activeRoomId,
      content,
    });
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

// ============ EXPORTS ============
export const {
  setActiveRoom,
  addMessage,
  socketMessageReceived,
  setOnlineUsers,
  setUserOnlineStatus,
  updateMessageDeliveryStatus,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
  updateMessagesReadStatus,
  clearSearchResults,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
