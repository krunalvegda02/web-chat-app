import { io } from 'socket.io-client';

class ChatSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners = new Map();
    this.eventQueue = [];
    this.connectionCheckInterval = null;
    this.lastToken = null;
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
    this.lastToken = token;

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
          this._startConnectionMonitor();
          resolve(this.socket);
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          this._stopConnectionMonitor();
          console.log('🔌 [SOCKET] Disconnected:', reason);

          // Auto-reconnect on unexpected disconnect
          if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
            console.log('🔄 [SOCKET] Attempting auto-reconnect...');
            setTimeout(() => {
              if (this.lastToken && !this.socket?.connected) {
                this.connect(this.lastToken).catch(err => {
                  console.error('❌ [SOCKET] Auto-reconnect failed:', err.message);
                });
              }
            }, 2000);
          }

          // Handle token expiration on disconnect
          const currentPath = window.location.pathname;
          if ((reason === 'io server disconnect' || reason === 'transport close') &&
            !currentPath.includes('/login') && !currentPath.includes('/register')) {
            const token = localStorage.getItem('token');
            if (!token) {
              window.location.href = '/login';
            }
          }
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

          // Redirect to login on token expiration (only if not already on login page or public chat)
          const currentPath = window.location.pathname;
          if ((data.message?.includes('expired') || data.message?.includes('Invalid token')) &&
            !currentPath.includes('/login') && !currentPath.includes('/register')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }

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

      // Return a promise that resolves when socket connects and event is sent
      return new Promise((resolve) => {
        let timeoutId;
        const checkInterval = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            this.socket.emit(event, data);
            console.log(`📤 [QUEUED-SENT] ${event}:`, data);
            resolve();
          }
        }, 100);

        // Timeout after 5 seconds - silently resolve to prevent UI blocking
        timeoutId = setTimeout(() => {
          clearInterval(checkInterval);
          console.warn(`⚠️ [EMIT] Socket connection timeout for: ${event} - will retry when connected`);
          resolve(); // Silently resolve to prevent hanging
        }, 5000);
      });
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

  _startConnectionMonitor() {
    this._stopConnectionMonitor();
    this.connectionCheckInterval = setInterval(() => {
      if (!this.socket?.connected && this.lastToken) {
        console.warn('⚠️ [MONITOR] Socket disconnected, attempting reconnect...');
        this.connect(this.lastToken).catch(err => {
          console.error('❌ [MONITOR] Reconnect failed:', err.message);
        });
      }
    }, 10000); // Check every 10 seconds
  }

  _stopConnectionMonitor() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  disconnect() {
    this._stopConnectionMonitor();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.listeners.clear();
      this.eventQueue = [];
      this.lastToken = null;
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
