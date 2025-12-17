import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { chatSocketClient } from '../sockets/chatSocketClient.js';
import { socketMessageReceived, addTypingUser, removeTypingUser } from '../redux/slices/chatSlice.jsx';

// Track if global listeners are initialized
let globalListenersInitialized = false;

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || isConnected) return;

    const initializeSocket = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const connectedSocket = await chatSocketClient.connect(
          token,
          (err) => {
            console.error('Socket error callback:', err);
            setError(err);
          }
        );

        setSocket(connectedSocket);
        setIsConnected(true);
        
        // Initialize global listeners once
        if (!globalListenersInitialized) {
          chatSocketClient.on('message_received', (data) => {
            console.log('✅ [GLOBAL] Message received:', data);
            dispatch(socketMessageReceived({ roomId: data.roomId, message: data }));
          });

          chatSocketClient.on('user_typing', (data) => {
            if (data.userId === user?._id) return;
            
            if (data.isTyping) {
              dispatch(addTypingUser({ userId: data.userId }));
            } else {
              dispatch(removeTypingUser({ userId: data.userId }));
            }
          });
          
          globalListenersInitialized = true;
          console.log('✅ [GLOBAL] Socket listeners initialized');
        }
      } catch (err) {
        console.error('Failed to initialize socket:', err);
        setError(err);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSocket();

    return () => {
      // Don't disconnect on unmount - socket should persist across routes
    };
  }, [token, isConnected, dispatch, user]);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  const disconnect = useCallback(() => {
    chatSocketClient.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, []);

  return {
    socket,
    isConnected,
    isLoading,
    error,
    disconnect,
  };
};

export default useSocket;
