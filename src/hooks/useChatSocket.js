
import { chatSocketClient } from '../sockets/chatSocketClient';

/**
 * ✅ Provides socket emit methods only
 * All socket listeners are handled globally in useSocket.js
 * This prevents duplicate listeners and ensures proper event filtering
 */
export const useChatSocket = () => {

  return {
    socket: chatSocketClient,
    
    joinRoom: (roomId) => {
      chatSocketClient.emit('join_room', { roomId });
    },
    
    leaveRoom: (roomId) => {
      chatSocketClient.emit('leave_room', { roomId });
    },

    markMessagesAsRead: (roomId, messageIds) => {
      chatSocketClient.emit('mark_messages_read', { roomId, messageIds });
    },

    startTyping: (roomId) => {
      chatSocketClient.emit('start_typing', { roomId });
    },

    stopTyping: (roomId) => {
      chatSocketClient.emit('stop_typing', { roomId });
    },

    sendMessage: (roomId, content, media) => {
      chatSocketClient.emit('send_message', { roomId, content, media });
    },

    editMessage: (messageId, content) => {
      chatSocketClient.emit('edit_message', { messageId, content });
    },

    deleteMessage: (messageId) => {
      chatSocketClient.emit('delete_message', { messageId });
    },
  };
};


export default useChatSocket;