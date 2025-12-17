export const SOCKET_CONFIG = {
  autoConnect: false,
  transports: ['websocket'],
  upgrade: true,
  rememberUpgrade: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  connectTimeout: 10000,
  rejectUnauthorized: false,
};

export const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 1.5,
};

export const OPERATION_TIMEOUT = 5000;
export const HEARTBEAT_INTERVAL = 30000;
