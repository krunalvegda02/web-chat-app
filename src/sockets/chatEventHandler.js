import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { chatSocketClient } from './chatSocketClient.js';

export const chatEventHandlers = {
  joinRoom: (roomId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
  },

  leaveRoom: (roomId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
  },

  sendMessage: (roomId, content) => {
    return chatSocketClient.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      roomId,
      content,
    });
  },

  editMessage: (messageId, content) => {
    return chatSocketClient.emit(SOCKET_EVENTS.EDIT_MESSAGE, {
      messageId,
      content,
    });
  },

  deleteMessage: (messageId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.DELETE_MESSAGE, {
      messageId,
    });
  },

  addReaction: (messageId, emoji) => {
    return chatSocketClient.emit(SOCKET_EVENTS.ADD_REACTION, {
      messageId,
      emoji,
    });
  },

  removeReaction: (messageId, emoji) => {
    return chatSocketClient.emit(SOCKET_EVENTS.REMOVE_REACTION, {
      messageId,
      emoji,
    });
  },

  startTyping: (roomId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.START_TYPING, { roomId });
  },

  stopTyping: (roomId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.STOP_TYPING, { roomId });
  },

  initiateCall: (targetUserId, callType, roomId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.CALL_INITIATE, {
      targetUserId,
      callType,
      roomId,
    });
  },

  acceptCall: (callerId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.CALL_ACCEPTED, { callerId });
  },

  rejectCall: (callerId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.CALL_REJECTED, { callerId });
  },

  endCall: (targetUserId) => {
    return chatSocketClient.emit(SOCKET_EVENTS.CALL_ENDED, { targetUserId });
  },

  sendWebRTCOffer: (targetUserId, offer) => {
    return chatSocketClient.emit(SOCKET_EVENTS.WEBRTC_OFFER, {
      targetUserId,
      offer,
    });
  },

  sendWebRTCAnswer: (targetUserId, answer) => {
    return chatSocketClient.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
      targetUserId,
      answer,
    });
  },

  sendICECandidate: (targetUserId, candidate) => {
    return chatSocketClient.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
      targetUserId,
      candidate,
    });
  },
};

export default chatEventHandlers;
