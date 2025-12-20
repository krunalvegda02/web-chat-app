import { io } from 'socket.io-client';

class ChatSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners = new Map();
    this.eventQueue = [];
  }

  async connect(token, onError) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('⏳ Socket connecting...');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkInterval);
            resolve(this.socket);
          }
        }, 100);
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5500';
        console.log('🔌 Connecting to:', `${socketUrl}/chat`);

        this.socket = io(`${socketUrl}/chat`, {
          auth: { token },
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.isConnecting = false;
          console.log('✅ [SOCKET] Connected:', this.socket.id);
          this._processEventQueue();
          resolve(this.socket);
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          console.log('🔌 [SOCKET] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ [SOCKET] Connection error:', error);
          this.isConnecting = false;
          if (onError) {
            onError({ type: 'CONNECTION_ERROR', message: error.message, error });
          }
        });

        this.socket.on('auth_error', (data) => {
          console.error('❌ [AUTH] Error:', data.message);
          this.isConnecting = false;
          this.disconnect();
          if (onError) {
            onError({ type: 'AUTH_ERROR', message: data.message });
          }
          reject(new Error(data.message));
        });

        this.socket.on('error', (data) => {
          console.error('❌ [ERROR]:', data.message);
          if (onError) {
            onError({ type: 'SOCKET_ERROR', message: data.message });
          }
        });

      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn(`⚠️ Socket not connected. Queueing event: ${event}`);
      this.eventQueue.push({ event, data });
      return Promise.reject(new Error('Socket not connected'));
    }

    console.log(`📤 [EMIT] ${event}:`, data);
    this.socket.emit(event, data);
    return Promise.resolve();
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn(`⚠️ Socket not initialized for event: ${event}`);
      return;
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listeners = this.listeners.get(event);
    if (listeners.some(l => l === callback)) {
      console.warn(`⚠️ Duplicate listener prevented for: ${event}`);
      return;
    }

    listeners.push(callback);
    this.socket.on(event, callback);
    console.log(`📡 [LISTEN] Registered listener for: ${event}`);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  offAll(event) {
    if (!this.socket) return;
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      this.socket.off(event, callback);
    });
    this.listeners.delete(event);
  }

  _processEventQueue() {
    while (this.eventQueue.length > 0) {
      const { event, data } = this.eventQueue.shift();
      this.socket.emit(event, data);
      console.log(`📤 [QUEUED] Sent: ${event}`);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.listeners.clear();
      this.eventQueue = [];
      console.log('🔌 Socket disconnected');
    }
  }

  getSocket() {
    return this.socket;
  }

  isReady() {
    return this.socket?.connected ?? false;
  }

  // Call methods
  initiateCall(targetUserId, callType, roomId) {
    return this.emit('call_initiate', { targetUserId, callType, roomId });
  }

  acceptCall(callId, callerId) {
    return this.emit('call_accepted', { callId, callerId });
  }

  rejectCall(callId, callerId) {
    return this.emit('call_rejected', { callId, callerId });
  }

  missedCall(callId, callerId) {
    return this.emit('call_missed', { callId, callerId });
  }

  endCall(callId, targetUserId, duration) {
    return this.emit('call_ended', { callId, targetUserId, duration });
  }

  sendWebRTCOffer(callId, targetUserId, offer) {
    return this.emit('webrtc_offer', { callId, targetUserId, offer });
  }

  sendWebRTCAnswer(callId, targetUserId, answer) {
    return this.emit('webrtc_answer', { callId, targetUserId, answer });
  }

  sendICECandidate(callId, targetUserId, candidate) {
    return this.emit('webrtc_ice_candidate', { callId, targetUserId, candidate });
  }
}

export const chatSocketClient = new ChatSocketClient();
export default ChatSocketClient;
