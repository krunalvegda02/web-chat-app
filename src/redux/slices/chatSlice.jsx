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


export const forwardMessageAPI = createAsyncThunkHandler(
  'chat/forwardMessage',
  _post,
  '/chat/forward-message'
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
      const previousRoomId = state.activeRoomId;
      state.activeRoomId = roomId;
      
      // ✅ Clear unread count when switching to a room
      if (roomId && Array.isArray(state.rooms)) {
        state.rooms = state.rooms.map(room => {
          if (room._id === roomId) {
            console.log(`📥 [REDUX] Clearing unread count for room: ${roomId}`);
            return { ...room, unreadCount: 0 };
          }
          return room;
        });
      }
      
      console.log(`🏠 [REDUX] Active room set to: ${roomId} (previous: ${previousRoomId})`);
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

      console.log('🔵 [REDUX] ========== socketMessageReceived ==========');
      console.log('🔵 [REDUX] Room ID:', roomId);
      console.log('🔵 [REDUX] Message:', { _id: message._id, content: message.content, type: message.type, status: message.status });
      console.log('🔵 [REDUX] Current messages in room:', state.messagesByRoom[roomId]?.length || 0);

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
        console.log('🆕 [REDUX] Creating new message array for room:', roomId);
        state.messagesByRoom[roomId] = [];
      }

      const exists = state.messagesByRoom[roomId].some(m => m._id === message._id && !m.optimistic);
      if (exists) {
        console.log(`⚠️ [REDUX] Duplicate message ignored: ${message._id}`);
        return;
      }

      const beforeCount = state.messagesByRoom[roomId].length;
      
      // ✅ Find and replace optimistic message by matching content and sender
      let replacedOptimistic = false;
      let finalMessage = null;
      const messageSenderId = (message.senderId?._id || message.senderId)?.toString();
      
      state.messagesByRoom[roomId] = state.messagesByRoom[roomId].map((m) => {
        if (m.optimistic && !replacedOptimistic) {
          const mSenderId = m.senderId?.toString();
          
          // Match by sender and either:
          // 1. Same content (for text messages)
          // 2. Same media type and similar timestamp (for media messages)
          const contentMatch = m.content === message.content;
          const mediaMatch = m.media?.length > 0 && message.media?.length > 0 && 
                            m.type === message.type &&
                            Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 5000; // Within 5 seconds
          
          if (mSenderId === messageSenderId && (contentMatch || mediaMatch)) {
            console.log(`🔄 [REDUX] Replacing optimistic message ${m._id} with real message ${message._id}`);
            replacedOptimistic = true;
            
            finalMessage = {
              ...message,
              sender: message.sender || (message.senderId && typeof message.senderId === 'object' ? message.senderId : null),
              senderId: message.senderId?._id || message.senderId,
              status: message.status || 'sent',
              optimistic: false,
              media: Array.isArray(message.media) ? message.media : [],
              type: message.type || (message.media && message.media.length > 0 ? (message.media[0].type || 'image') : 'text'),
              _updatedAt: Date.now(),
            };
            
            return finalMessage;
          }
        }
        return m;
      });
      
      // If no optimistic message was replaced, add as new message
      if (!replacedOptimistic) {
        finalMessage = {
          ...message,
          sender: message.sender || (message.senderId && typeof message.senderId === 'object' ? message.senderId : null),
          senderId: message.senderId?._id || message.senderId,
          status: message.status || 'sent',
          optimistic: false,
          media: Array.isArray(message.media) ? message.media : [],
          type: message.type || (message.media && message.media.length > 0 ? (message.media[0].type || 'image') : 'text'),
          _updatedAt: Date.now(),
        };
        
        console.log('✅ [REDUX] Adding new message:', { _id: finalMessage._id, sender: finalMessage.sender?.name, status: finalMessage.status });
        state.messagesByRoom[roomId].push(finalMessage);
      }
      
      const afterCount = state.messagesByRoom[roomId].length;
      console.log(`📊 [REDUX] Messages: ${beforeCount} → ${afterCount}`);
      
      console.log('🔵 [REDUX] Total messages in room after add:', state.messagesByRoom[roomId].length);

      state.pendingMessageIds = state.pendingMessageIds.filter(id => !id.startsWith('temp-'));

      // Update room list only if finalMessage exists
      if (finalMessage) {
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
      }

      console.log('🔵 [REDUX] ========== END socketMessageReceived ==========');
    },


    // ✅ Update single message status
    updateMessageStatus(state, action) {
      const { roomId, messageId, status } = action.payload;
      console.log(`📊 [REDUX] updateMessageStatus called:`, { roomId, messageId, status });

      if (!state.messagesByRoom[roomId]) {
        console.warn(`⚠️ [REDUX] Room ${roomId} not found for updateMessageStatus`);
        return;
      }

      // Create new array to trigger re-render
      state.messagesByRoom[roomId] = state.messagesByRoom[roomId].map(message => {
        if (message._id === messageId || message._id.toString() === messageId.toString()) {
          console.log(`✅ [REDUX] Updating message ${messageId} status from ${message.status} to ${status}`);
          return {
            ...message,
            status,
            _updatedAt: Date.now(), // ✅ Force re-render
            ...(status === 'read' && { readAt: new Date().toISOString() })
          };
        }
        return message;
      });

      state.messageDeliveryStatus[messageId] = status;
      console.log(`📊 [REDUX] Message status updated: ${messageId} → ${status}`);
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
      console.log(`🟦 [REDUX] updateMessagesReadStatus called with:`, { roomId, messageIds });

      if (!state.messagesByRoom[roomId]) {
        console.warn(`⚠️ [REDUX] Room ${roomId} not found in messagesByRoom`);
        console.warn(`⚠️ [REDUX] Available rooms:`, Object.keys(state.messagesByRoom));
        return;
      }

      console.log(`🟦 [REDUX] Messages in room before update:`, state.messagesByRoom[roomId].map(m => ({ id: m._id, status: m.status })));

      let updatedCount = 0;
      const messageIdStrings = messageIds.map(id => id.toString());
      console.log(`🟦 [REDUX] Looking for message IDs:`, messageIdStrings);
      
      // Create completely new array to force re-render
      const updatedMessages = state.messagesByRoom[roomId].map(message => {
        const messageIdStr = message._id.toString();
        console.log(`🟦 [REDUX] Checking message ${messageIdStr}, current status: ${message.status}, included: ${messageIdStrings.includes(messageIdStr)}`);
        
        if (messageIdStrings.includes(messageIdStr)) {
          // Only update if status is not already 'read'
          if (message.status !== 'read') {
            updatedCount++;
            console.log(`✅ [REDUX] Updating message ${messageIdStr} from ${message.status} to read`);
            // Create completely new object with timestamp to force re-render
            return {
              ...message,
              status: 'read',
              readAt: new Date().toISOString(),
              _updatedAt: Date.now() // Force React to detect change
            };
          } else {
            console.log(`⏭️ [REDUX] Message ${messageIdStr} already read, skipping`);
          }
        }
        return message;
      });

      // Replace entire array to ensure React detects change
      state.messagesByRoom[roomId] = updatedMessages;

      messageIds.forEach(id => {
        state.messageDeliveryStatus[id.toString()] = 'read';
      });

      console.log(`👁️ [REDUX] Marked ${updatedCount}/${messageIds.length} messages as read in room ${roomId}`);
      console.log(`🟦 [REDUX] Messages in room after update:`, state.messagesByRoom[roomId].map(m => ({ id: m._id, status: m.status })));
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

    // ✅ Delete message for current user only
    deleteMessageForMe(state, action) {
      const { messageId, userId } = action.payload;

      for (const roomId in state.messagesByRoom) {
        const message = state.messagesByRoom[roomId].find(m => m._id === messageId);
        if (message) {
          if (!message.deletedForUsers) {
            message.deletedForUsers = [];
          }
          if (!message.deletedForUsers.includes(userId)) {
            message.deletedForUsers.push(userId);
          }
          console.log(`🗑️ [REDUX] Message deleted for user ${userId}: ${messageId}`);
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
      console.log("=========action", action.payload);
      if (!Array.isArray(state.rooms)) return;
      
      // ✅ Ensure unreadCount is a valid number
      const validUnreadCount = typeof unreadCount === 'number' && unreadCount >= 0 ? unreadCount : 0;
      
      state.rooms = state.rooms.map(room => {
        if (room._id === roomId) {
          console.log(`🔔 [REDUX] Unread count updated for room ${roomId}: ${room.unreadCount} → ${validUnreadCount}`);
          return { ...room, unreadCount: validUnreadCount };
        }
        return room;
      });
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
        
        console.log(`📦 [REDUX] fetchRooms.fulfilled - Raw payload:`, action.payload);
        console.log(`📦 [REDUX] fetchRooms.fulfilled - Rooms array:`, roomsArray.map(r => ({ 
          id: r._id, 
          name: r.name, 
          unreadCount: r.unreadCount 
        })));
        
        state.rooms = Array.isArray(roomsArray) ? roomsArray : [];
        
        console.log(`📥 [REDUX] Fetched ${state.rooms.length} rooms - State updated`);
        console.log(`📥 [REDUX] Current activeRoomId:`, state.activeRoomId);

        // Don't auto-set active room - let user click to open
        // if (!state.activeRoomId && state.rooms.length > 0) {
        //   state.activeRoomId = state.rooms[0]._id;
        // }
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loadingRooms = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state, action) => {
        const roomId = action.meta.arg.roomId;
        const page = action.meta.arg.page || 1;
        // Only show loading for initial page load
        if (page === 1) {
          state.loadingMessages[roomId] = true;
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const roomId = action.meta.arg.roomId;
        const page = action.meta.arg.page || 1;
        state.loadingMessages[roomId] = false;

        const messagesArray = action.payload?.data?.messages || action.payload?.messages || [];
        const roomData = action.payload?.data?.room;
        
        const normalizedMessages = Array.isArray(messagesArray) 
          ? messagesArray.map(msg => {
              let messageStatus = msg.status || 'sent';
              
              if (msg.readBy && Array.isArray(msg.readBy) && msg.readBy.length > 0) {
                messageStatus = 'read';
              } else if (msg.status === 'delivered') {
                messageStatus = 'delivered';
              }
              
              return {
                ...msg,
                sender: msg.senderId && typeof msg.senderId === 'object' ? msg.senderId : msg.sender,
                senderId: msg.senderId?._id || msg.senderId,
                status: messageStatus,
                media: Array.isArray(msg.media) ? msg.media : [],
                type: msg.type || (msg.media && msg.media.length > 0 ? (msg.media[0].type || 'image') : 'text'),
              };
            })
          : [];

        // Reverse messages since backend returns newest first
        const reversedMessages = [...normalizedMessages].reverse();

        // Page 1: replace messages, Page 2+: prepend old messages
        if (page === 1) {
          state.messagesByRoom[roomId] = reversedMessages;
        } else {
          const existing = state.messagesByRoom[roomId] || [];
          const existingIds = new Set(existing.map(m => m._id));
          const newMessages = reversedMessages.filter(m => !existingIds.has(m._id));
          state.messagesByRoom[roomId] = [...newMessages, ...existing];
        }

        normalizedMessages.forEach(msg => {
          if (msg._id) {
            state.messageDeliveryStatus[msg._id] = msg.status || 'read';
          }
        });

        if (roomData && Array.isArray(state.rooms)) {
          const roomIndex = state.rooms.findIndex(r => r._id === roomId);
          if (roomIndex !== -1) {
            state.rooms[roomIndex] = { ...state.rooms[roomIndex], ...roomData };
          } else {
            state.rooms.push(roomData);
          }
        }

        console.log(`✅ [REDUX] Fetched ${normalizedMessages.length} messages for room ${roomId} (page ${page})`);
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
  deleteMessageForMe,
  addReaction,
  removeReaction,
  updateRoomUnreadCount,
  clearError,
} = chatSlice.actions;


export default chatSlice.reducer;