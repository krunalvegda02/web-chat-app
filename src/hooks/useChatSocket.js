import { useCallback } from 'react';
import { useSocket } from './useSocket';
import { chatSocketClient } from '../sockets/chatSocketClient';


export const useChatSocket = () => {
  const { socket, isConnected } = useSocket();

  // ✅ Join room
  const joinRoom = useCallback((roomId) => {
    if (!isConnected) {
      console.warn('⚠️ Socket not connected');
      return;
    }
    chatSocketClient.emit('join_room', { roomId });
    console.log(`🏠 [ACTION] Joining room: ${roomId}`);
  }, [isConnected]);

  // ✅ Leave room
  const leaveRoom = useCallback((roomId) => {
    if (!isConnected) return;
    chatSocketClient.emit('leave_room', { roomId });
    console.log(`🚪 [ACTION] Leaving room: ${roomId}`);
  }, [isConnected]);

  // ✅ Send message
  const sendMessage = useCallback((roomId, content) => {
    if (!isConnected) {
      console.warn('⚠️ Socket not connected');
      return Promise.reject(new Error('Socket not connected'));
    }
    console.log(`📤 [ACTION] Sending message in room ${roomId}`);
    return chatSocketClient.emit('send_message', { roomId, content });
  }, [isConnected]);

  // ✅ Start typing
  const startTyping = useCallback((roomId) => {
    if (!isConnected) return;
    chatSocketClient.emit('start_typing', { roomId });
    console.log(`⌨️ [ACTION] Start typing in room ${roomId}`);
  }, [isConnected]);

  // ✅ Stop typing
  const stopTyping = useCallback((roomId) => {
    if (!isConnected) return;
    chatSocketClient.emit('stop_typing', { roomId });
    console.log(`🛑 [ACTION] Stop typing in room ${roomId}`);
  }, [isConnected]);

  // ✅ Edit message
  const editMessage = useCallback((messageId, content) => {
    if (!isConnected) return;
    chatSocketClient.emit('edit_message', { messageId, content });
    console.log(`✏️ [ACTION] Editing message ${messageId}`);
  }, [isConnected]);

  // ✅ Delete message
  const deleteMessage = useCallback((messageId) => {
    if (!isConnected) return;
    chatSocketClient.emit('delete_message', { messageId });
    console.log(`🗑️ [ACTION] Deleting message ${messageId}`);
  }, [isConnected]);

  // ✅ Add reaction
  const addReaction = useCallback((messageId, emoji) => {
    if (!isConnected) return;
    chatSocketClient.emit('add_reaction', { messageId, emoji });
    console.log(`😊 [ACTION] Added reaction ${emoji} to message ${messageId}`);
  }, [isConnected]);

  // ✅ Remove reaction
  const removeReaction = useCallback((messageId, emoji) => {
    if (!isConnected) return;
    chatSocketClient.emit('remove_reaction', { messageId, emoji });
    console.log(`😔 [ACTION] Removed reaction ${emoji} from message ${messageId}`);
  }, [isConnected]);

  // ✅ Mark messages as read
  const markMessagesAsRead = useCallback((roomId, messageIds) => {
    if (!isConnected || !messageIds || messageIds.length === 0) return;
    chatSocketClient.emit('mark_messages_read', { roomId, messageIds });
    console.log(`📖 [ACTION] Marking ${messageIds.length} messages as read in room ${roomId}`);
  }, [isConnected]);

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markMessagesAsRead,
  };
};

export default useChatSocket;
