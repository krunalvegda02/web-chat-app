import { useEffect } from 'react';
import { chatSocketClient } from '../sockets/chatSocketClient';

/**
 * Performance monitor for real-time message processing
 * Tracks timing from socket event to UI update
 */
export const useMessagePerformanceMonitor = () => {
  useEffect(() => {
    if (!chatSocketClient.socket) return;

    const messageTimings = new Map();

    // Track when message is received from socket
    const trackMessageReceived = (data) => {
      if (data && data._id) {
        messageTimings.set(data._id, {
          socketReceived: performance.now(),
          messageId: data._id,
          roomId: data.roomId
        });
        console.log(`⚡ [PERF] Message ${data._id} received at socket: ${performance.now()}ms`);
      }
    };

    // Track when Redux state is updated
    const trackReduxUpdate = () => {
      // This will be called after Redux updates
      setTimeout(() => {
        messageTimings.forEach((timing, messageId) => {
          if (timing.socketReceived && !timing.reduxUpdated) {
            timing.reduxUpdated = performance.now();
            const delay = timing.reduxUpdated - timing.socketReceived;
            
            if (delay > 100) {
              console.warn(`🐌 [PERF] SLOW Redux update for ${messageId}: ${delay.toFixed(2)}ms`);
            } else if (delay > 50) {
              console.log(`⚠️ [PERF] Medium Redux update for ${messageId}: ${delay.toFixed(2)}ms`);
            } else {
              console.log(`⚡ [PERF] FAST Redux update for ${messageId}: ${delay.toFixed(2)}ms`);
            }
            
            // Clean up old timings
            setTimeout(() => messageTimings.delete(messageId), 5000);
          }
        });
      }, 10);
    };

    // Listen to socket events
    chatSocketClient.on('message_received', trackMessageReceived);
    
    // Listen to Redux store changes
    const unsubscribe = window.__REDUX_STORE__?.subscribe(trackReduxUpdate);

    return () => {
      chatSocketClient.off('message_received', trackMessageReceived);
      if (unsubscribe) unsubscribe();
      messageTimings.clear();
    };
  }, []);
};

export default useMessagePerformanceMonitor;