import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { chatSocketClient } from '../sockets/chatSocketClient';
import {
  socketMessageReceived,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
  updateMessageStatus,
  updateMessagesReadStatus,
} from '../redux/slices/chatSlice';

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
        const connectedSocket = await chatSocketClient.connect(token, (err) => {
          console.error('Socket error:', err);
          setError(err);
        });

        setSocket(connectedSocket);
        setIsConnected(true);

        // ✅ Initialize global listeners ONCE
        if (!globalListenersInitialized) {
          // Message received event
          chatSocketClient.on('message_received', (data) => {
            console.log('✅ [GLOBAL] message_received:', data);
            dispatch(socketMessageReceived({ roomId: data.roomId, message: data }));
          });

          // Message delivered event
          chatSocketClient.on('message_delivered', (data) => {
            console.log('✅ [GLOBAL] message_delivered:', data);
            dispatch(updateMessageStatus({
              roomId: data.roomId || 'unknown',
              messageId: data.messageId,
              status: 'delivered',
            }));
          });

          // Messages read event
          chatSocketClient.on('messages_read', (data) => {
            console.log('✅ [GLOBAL] messages_read:', data);
            dispatch(updateMessagesReadStatus({
              roomId: data.roomId,
              messageIds: data.messageIds,
            }));
          });

          // User typing event
          chatSocketClient.on('user_typing', (data) => {
            console.log('✅ [GLOBAL] user_typing:', data);
            if (data.userId === user?._id) return;

            if (data.isTyping) {
              dispatch(addTypingUser({ userId: data.userId }));
            } else {
              dispatch(removeTypingUser({ userId: data.userId }));
            }
          });

          // Online users event
          chatSocketClient.on('online_users', (data) => {
            console.log('✅ [GLOBAL] online_users:', data.users);
            dispatch(setOnlineUsers(data.users || []));
          });

          // Room updated event
          chatSocketClient.on('room_updated', (data) => {
            console.log('✅ [GLOBAL] room_updated:', data);
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
      // Don't disconnect on unmount - keep connection alive
    };
  }, [token, isConnected, dispatch, user]);

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
