import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from './useSocket.js';
import { useSocketEvents } from './useSocketEvents.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { chatEventHandlers } from '../sockets/chatEventHandler.js';
import { addTypingUser, removeTypingUser } from '../redux/slices/chatSlice.jsx';

export const useChatSocket = (callbacks = {}) => {
  const { socket, isConnected, error, isLoading } = useSocket();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  useSocketEvents(
    {
      [SOCKET_EVENTS.MESSAGE_RECEIVED]: callbacks.onMessageReceived,
      [SOCKET_EVENTS.MESSAGE_EDITED]: callbacks.onMessageEdited,
      [SOCKET_EVENTS.MESSAGE_DELETED]: callbacks.onMessageDeleted,
      [SOCKET_EVENTS.REACTION_ADDED]: callbacks.onReactionAdded,
      [SOCKET_EVENTS.REACTION_REMOVED]: callbacks.onReactionRemoved,
      [SOCKET_EVENTS.USER_TYPING]: (data) => {
        // Ignore own typing events
        if (data.userId === user?._id) {
          console.log(`🚫 [SOCKET] Ignoring own typing event`);
          return;
        }
        
        if (data.isTyping === false) {
          dispatch(removeTypingUser({ userId: data.userId }));
          console.log(`🛑 [SOCKET] User ${data.userId} stopped typing`);
        } else {
          dispatch(addTypingUser({ userId: data.userId }));
          console.log(`⌨️ [SOCKET] User ${data.userId} is typing`);
        }
        callbacks.onUserTyping?.(data);
      },
      [SOCKET_EVENTS.USER_JOINED]: callbacks.onUserJoined,
      [SOCKET_EVENTS.USER_LEFT]: callbacks.onUserLeft,
      [SOCKET_EVENTS.ONLINE_USERS]: callbacks.onOnlineUsers,
      ['unread_count_updated']: (data) => {
        // Update unread count for specific room
        console.log(`📖 [UNREAD] Room ${data.roomId} unread count: ${data.unreadCount}`);
        callbacks.onUnreadCountUpdated?.(data);
      },
      ['messages_read']: (data) => {
        // Update read status for messages
        console.log(`📖 [READ] Messages read by user ${data.userId}:`, data.messageIds);
        callbacks.onMessagesRead?.(data);
      },
    },
    [callbacks, dispatch]
  );

  const joinRoom = useCallback((roomId) => {
    return chatEventHandlers.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId) => {
    return chatEventHandlers.leaveRoom(roomId);
  }, []);

  const sendMessage = useCallback((roomId, content) => {
    return chatEventHandlers.sendMessage(roomId, content);
  }, []);

  const editMessage = useCallback((messageId, content) => {
    return chatEventHandlers.editMessage(messageId, content);
  }, []);

  const deleteMessage = useCallback((messageId) => {
    return chatEventHandlers.deleteMessage(messageId);
  }, []);

  const addReaction = useCallback((messageId, emoji) => {
    return chatEventHandlers.addReaction(messageId, emoji);
  }, []);

  const removeReaction = useCallback((messageId, emoji) => {
    return chatEventHandlers.removeReaction(messageId, emoji);
  }, []);

  const startTyping = useCallback((roomId) => {
    return chatEventHandlers.startTyping(roomId);
  }, []);

  // ✅ ADDED: Explicit stop typing with socket emit
  const stopTyping = useCallback((roomId) => {
    if (socket?.connected) {
      socket.emit('stop_typing', { roomId });
      console.log(`🛑 [EMIT] Sent stop_typing for room ${roomId}`);
    }
    return chatEventHandlers.stopTyping(roomId);
  }, [socket]);

  return {
    socket,
    isConnected,
    isLoading,
    error,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
  };
};

export default useChatSocket;
