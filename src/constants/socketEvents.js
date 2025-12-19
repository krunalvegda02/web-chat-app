export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  SEND_MESSAGE: 'send_message',
  MESSAGE_RECEIVED: 'message_received',
  EDIT_MESSAGE: 'edit_message',
  MESSAGE_EDITED: 'message_edited',
  DELETE_MESSAGE: 'delete_message',
  MESSAGE_DELETED: 'message_deleted',
  ADD_REACTION: 'add_reaction',
  REACTION_ADDED: 'reaction_added',
  REMOVE_REACTION: 'remove_reaction',
  REACTION_REMOVED: 'reaction_removed',
  START_TYPING: 'start_typing',
  STOP_TYPING: 'stop_typing',
  USER_TYPING: 'user_typing',
  ONLINE_USERS: 'online_users',
  ERROR: 'error',
  AUTH_ERROR: 'auth_error',
  // WebRTC Events
  CALL_INITIATE: 'call_initiate',
  CALL_INCOMING: 'call_incoming',
  CALL_ACCEPTED: 'call_accepted',
  CALL_REJECTED: 'call_rejected',
  CALL_ENDED: 'call_ended',
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  MEDIA: 'media',
  SYSTEM: 'system',
};

export const SOCKET_ERRORS = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  AUTH_FAILED: 'AUTH_FAILED',
  ROOM_ACCESS_DENIED: 'ROOM_ACCESS_DENIED',
  MESSAGE_SEND_FAILED: 'MESSAGE_SEND_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
};
