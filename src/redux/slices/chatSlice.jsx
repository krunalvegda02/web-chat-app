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
  (tenantId) => buildUrlWithParams(API.CHAT.ROOMS, tenantId ? { tenantId } : {})
);


export const fetchMessages = createAsyncThunkHandler(
  'chat/fetchMessages',
  _get,
  (payload) => buildUrlWithParams(`${API.CHAT.ROOM_MESSAGES}/${payload.roomId}/messages`, { page: payload.page || 1, limit: payload.limit || 50 })
);


export const fetchAvailableUsers = createAsyncThunkHandler(
  'chat/fetchAvailableUsers',
  _get,
  (payload) => buildUrlWithParams(API.CHAT.AVAILABLE_USERS, payload || {})
);


export const createDirectRoom = createAsyncThunkHandler(
  'chat/createDirectRoom',
  _post,
  API.CHAT.DIRECT
);

export const createChatFromContact = createAsyncThunkHandler(
  'chat/createChatFromContact',
  _post,
  API.CHAT.CONTACT_CHAT
);


export const createAdminChat = createAsyncThunkHandler(
  'chat/createAdminChat',
  _post,
  API.CHAT.ADMIN_CHAT
);


export const createGroupRoom = createAsyncThunkHandler(
  'chat/createGroupRoom',
  _post,
  API.CHAT.GROUP
);


export const sendMessageAPI = createAsyncThunkHandler(
  'chat/sendMessage',
  _post,
  API.CHAT.SEND_MESSAGE
);


export const uploadChatMedia = createAsyncThunkHandler(
  'chat/uploadMedia',
  _post,
  API.UPLOAD.CHAT_MEDIA,
  true // isMultipart - required for FormData file uploads
);


export const editMessageAPI = createAsyncThunkHandler(
  'chat/editMessage',
  (payload) => _post(payload, `${API.CHAT.EDIT_MESSAGE}/${payload.messageId}`),
  null
);


export const deleteMessageAPI = createAsyncThunkHandler(
  'chat/deleteMessage',
  (payload) => _post(payload, `${API.CHAT.DELETE_MESSAGE}/${payload.messageId}`),
  null
);


export const markMessagesDelivered = createAsyncThunkHandler(
  'chat/markDelivered',
  _post,
  API.CHAT.MARK_DELIVERED
);


export const createOrGetRoom = createAsyncThunkHandler(
  'chat/createOrGetRoom',
  _post,
  API.CHAT.CREATE_OR_GET_ROOM
);


// ============ THUNK ACTIONS (Socket + Optimistic) ============


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
    console.log('✅ Joined room:', roomId);
    
    setTimeout(() => {
      chatSocketClient.emit('mark_room_read', { roomId });
      console.log('✅ Marked room as read:', roomId);
    }, 200);
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
  typingUsers: {},
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
      const roomId = action.payload;
      state.activeRoomId = roomId;
      
      // Clear unread count for this room
      const roomsArray = Array.isArray(state.rooms) ? [...state.rooms] : [];
      const room = roomsArray.find(r => r._id === roomId);
      if (room && room.unreadCount > 0) {
        room.unreadCount = 0;
        state.rooms = roomsArray;
        console.log(`📥 [REDUX] Cleared unread count for room: ${roomId}`);
      }
      
      console.log(`🏠 [REDUX] Active room set to: ${roomId}`);
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
          state.pendingMessageIds.push(message._id);
        }
      }

      console.log(`✅ [REDUX] Message added (optimistic: ${message.optimistic}):`, message._id);
    },


    socketMessageReceived(state, action) {
      const { roomId, message } = action.payload;

      console.log('🔍 [DEBUG] Socket message received:', message._id, message.content, message.type);
      if (message.type === 'call') {
        console.log('📞 [DEBUG] CALL MESSAGE RECEIVED:', {
          _id: message._id,
          type: message.type,
          content: message.content,
          callLog: message.callLog,
          senderId: message.senderId,
          sender: message.sender
        });
      }

      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = [];
      }

      const exists = state.messagesByRoom[roomId].some(m => m._id === message._id && !m.optimistic);
      if (exists) {
        console.log(`⚠️ [REDUX] Duplicate message ignored: ${message._id}`);
        return;
      }

      const beforeCount = state.messagesByRoom[roomId].length;
      state.messagesByRoom[roomId] = state.messagesByRoom[roomId].filter((m) => {
        if (!m.optimistic) return true;
        if (m.content === message.content) {
          console.log(`🗑️ [REDUX] Removing optimistic message: ${m._id}`);
          return false;
        }
        return true;
      });
      const afterCount = state.messagesByRoom[roomId].length;
      console.log(`📊 [REDUX] Removed ${beforeCount - afterCount} optimistic messages`);

      const finalMessage = {
        ...message,
        sender: message.sender || (message.senderId && typeof message.senderId === 'object' ? message.senderId : null),
        senderId: message.senderId?._id || message.senderId,
        status: message.status || 'sent',
        optimistic: false,
        // Ensure media array is preserved
        media: Array.isArray(message.media) ? message.media : [],
        // Ensure type is set
        type: message.type || (message.media && message.media.length > 0 ? (message.media[0].type || 'image') : 'text'),
      };

      console.log('✅ [DEBUG] Adding real message with sender:', finalMessage.sender?.name);

      state.messagesByRoom[roomId].push(finalMessage);

      state.pendingMessageIds = state.pendingMessageIds.filter(id => !id.startsWith('temp-'));

      const roomsArray = Array.isArray(state.rooms) ? [...state.rooms] : [];
      const roomIndex = roomsArray.findIndex(r => r._id === roomId);
      if (roomIndex !== -1) {
        const room = roomsArray[roomIndex];
        room.lastMessage = finalMessage;
        room.lastMessageTime = finalMessage.createdAt;
        room.lastMessagePreview = finalMessage.content?.substring(0, 50) || '';
        roomsArray.splice(roomIndex, 1);
        roomsArray.unshift(room);
        state.rooms = roomsArray;
        console.log(`📋 [REDUX] Room list updated for room: ${roomId}`);
      } else {
        console.warn(`⚠️ [REDUX] Room ${roomId} not found in rooms array`);
      }

      console.log(`💬 [REDUX] Real message added: ${message._id}, total messages: ${state.messagesByRoom[roomId].length}`);
    },


    // ✅ Update single message status
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


    // ✅ Update bulk message status
    updateMessagesStatus(state, action) {
      const { roomId, messageIds, status } = action.payload;

      if (!state.messagesByRoom[roomId]) return;

      let updatedCount = 0;
      const messageIdStrings = messageIds.map(id => id.toString());

      state.messagesByRoom[roomId] = state.messagesByRoom[roomId].map(message => {
        if (messageIdStrings.includes(message._id.toString())) {
          updatedCount++;
          return {
            ...message,
            status,
            ...(status === 'read' && { readAt: new Date().toISOString() })
          };
        }
        return message;
      });

      messageIds.forEach(id => {
        state.messageDeliveryStatus[id] = status;
      });

      console.log(`📊 [REDUX] Updated ${updatedCount}/${messageIds.length} messages to status: ${status}`);
    },


    // ✅ Track typing users by room
    addTypingUser(state, action) {
      const { userId, roomId } = action.payload;
      
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }

      if (!state.typingUsers[roomId].includes(userId)) {
        state.typingUsers[roomId].push(userId);
        console.log(`⌨️ [REDUX] User ${userId} typing in room ${roomId}`);
      }
    },


    // ✅ Remove typing user from specific room
    removeTypingUser(state, action) {
      const { userId, roomId } = action.payload;
      
      if (state.typingUsers[roomId]) {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(id => id !== userId);
        console.log(`🛑 [REDUX] User ${userId} stopped typing in room ${roomId}`);
      }
    },


    // ✅ Clear typing users for specific room
    clearRoomTypingUsers(state, action) {
      const { roomId } = action.payload;
      state.typingUsers[roomId] = [];
    },


    clearTypingUsers(state) {
      state.typingUsers = {};
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


    // ✅ Mark messages as read
    updateMessagesReadStatus(state, action) {
      const { roomId, messageIds } = action.payload;

      if (!state.messagesByRoom[roomId]) {
        console.warn(`⚠️ [REDUX] Room ${roomId} not found in messagesByRoom`);
        return;
      }

      let updatedCount = 0;
      const messageIdStrings = messageIds.map(id => id.toString());
      
      state.messagesByRoom[roomId] = state.messagesByRoom[roomId].map(message => {
        if (messageIdStrings.includes(message._id.toString())) {
          updatedCount++;
          return {
            ...message,
            status: 'read',
            readAt: new Date().toISOString()
          };
        }
        return message;
      });

      messageIds.forEach(id => {
        state.messageDeliveryStatus[id] = 'read';
      });

      console.log(`👁️ [REDUX] Marked ${updatedCount}/${messageIds.length} messages as read in room ${roomId}`);
    },


    // ✅ Edit message
    editMessage(state, action) {
      const { messageId, content, editedAt } = action.payload;

      for (const roomId in state.messagesByRoom) {
        const message = state.messagesByRoom[roomId].find(m => m._id === messageId);
        if (message) {
          message.content = content;
          message.isEdited = true;
          message.editedAt = editedAt || new Date().toISOString();
          console.log(`✏️ [REDUX] Message edited: ${messageId}`);
          return;
        }
      }
    },


    // ✅ Delete message (soft delete)
    deleteMessage(state, action) {
      const { messageId, deletedAt } = action.payload;

      for (const roomId in state.messagesByRoom) {
        const message = state.messagesByRoom[roomId].find(m => m._id === messageId);
        if (message) {
          message.isDeleted = true;
          message.deletedAt = deletedAt || new Date().toISOString();
          console.log(`🗑️ [REDUX] Message marked as deleted: ${messageId}`);
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


    updateRoomUnreadCount(state, action) {
      const { roomId, unreadCount } = action.payload;
      const roomsArray = Array.isArray(state.rooms) ? [...state.rooms] : [];
      const room = roomsArray.find(r => r._id === roomId);
      if (room) {
        room.unreadCount = unreadCount;
        state.rooms = roomsArray;
        console.log(`🔔 [REDUX] Unread count updated for room ${roomId}: ${unreadCount}`);
      } else {
        console.warn(`⚠️ [REDUX] Room ${roomId} not found for unread count update`);
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
      .addCase(fetchMessages.pending, (state, action) => {
        const roomId = action.meta.arg.roomId;
        state.loadingMessages[roomId] = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const roomId = action.meta.arg.roomId;
        state.loadingMessages[roomId] = false;

        const messagesArray = action.payload?.data?.messages || action.payload?.messages || [];
        const roomData = action.payload?.data?.room;
        
        state.messagesByRoom[roomId] = Array.isArray(messagesArray) 
          ? messagesArray.map(msg => ({
              ...msg,
              sender: msg.senderId && typeof msg.senderId === 'object' ? msg.senderId : msg.sender,
              senderId: msg.senderId?._id || msg.senderId,
              status: msg.status || 'read',
              // Ensure media array is preserved
              media: Array.isArray(msg.media) ? msg.media : [],
              // Ensure type is set
              type: msg.type || (msg.media && msg.media.length > 0 ? (msg.media[0].type || 'image') : 'text'),
            }))
          : [];

        messagesArray.forEach(msg => {
          if (msg._id) {
            state.messageDeliveryStatus[msg._id] = msg.status || 'read';
          }
        });

        // Update room details if provided
        if (roomData && Array.isArray(state.rooms)) {
          const roomIndex = state.rooms.findIndex(r => r._id === roomId);
          if (roomIndex !== -1) {
            state.rooms[roomIndex] = { ...state.rooms[roomIndex], ...roomData };
          } else {
            state.rooms.push(roomData);
          }
        }

        console.log(`✅ [REDUX] Fetched ${state.messagesByRoom[roomId].length} messages for room ${roomId}`);
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
  updateMessagesStatus,
  addTypingUser,
  removeTypingUser,
  clearRoomTypingUsers,
  clearTypingUsers,
  setOnlineUsers,
  setUserOnlineStatus,
  updateMessagesReadStatus,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  updateRoomUnreadCount,
  clearError,
} = chatSlice.actions;


export default chatSlice.reducer;