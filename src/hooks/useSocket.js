
import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { chatSocketClient } from '../sockets/chatSocketClient';
import {
  socketMessageReceived,
  addTypingUser,
  removeTypingUser,
  clearRoomTypingUsers,
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

        // ✅ FIX: Initialize global listeners ONCE with better error handling
        if (!globalListenersInitialized) {
          // ✅ Message received event
          chatSocketClient.on('message_received', (data) => {
            console.log('✅ [SOCKET] message_received:', data);
            if (data && data.roomId) {
              dispatch(socketMessageReceived({
                roomId: data.roomId,
                message: data
              }));

              // ✅ Auto-mark as read if message is from someone else and we're viewing this room
              const state = window.__REDUX_STORE__?.getState();
              const activeRoomId = state?.chat?.activeRoomId;
              
              if (activeRoomId === data.roomId && data.senderId !== user?._id) {
                // Mark this message as read
                setTimeout(() => {
                  chatSocketClient.emit('mark_messages_read', {
                    roomId: data.roomId,
                    messageIds: [data._id]
                  });
                  console.log(`📖 [AUTO] Auto-marked message ${data._id} as read`);
                }, 500);
              }
            }
          });

          // ✅ FIX: Message sent event (emit by server after send succeeds)
          chatSocketClient.on('message_sent', (data) => {
            console.log('✅ [SOCKET] message_sent:', data);
            if (data && data.messageId && data.roomId) {
              dispatch(updateMessageStatus({
                roomId: data.roomId,
                messageId: data.messageId,
                status: 'sent' // ✅ FIX: Change to 'sent' instead of 'delivered'
              }));
            }
          });

          // ✅ Message delivered event
          chatSocketClient.on('message_delivered', (data) => {
            console.log('✅ [SOCKET] message_delivered:', data);
            if (data && data.messageId && data.roomId) {
              dispatch(updateMessageStatus({
                roomId: data.roomId,
                messageId: data.messageId,
                status: 'delivered'
              }));
            }
          });

          // ✅ FIX: Messages read event with proper roomId
          chatSocketClient.on('messages_read', (data) => {
            console.log('✅ [SOCKET] messages_read EVENT RECEIVED:', JSON.stringify(data));
            if (data && data.roomId && data.messageIds && data.messageIds.length > 0) {
              console.log(`👁️ [SOCKET] Dispatching updateMessagesReadStatus for ${data.messageIds.length} messages`);
              console.log(`👁️ [SOCKET] Message IDs:`, data.messageIds);
              console.log(`👁️ [SOCKET] Room ID:`, data.roomId);
              
              dispatch(updateMessagesReadStatus({
                roomId: data.roomId,
                messageIds: data.messageIds
              }));
              
              console.log(`✅ [SOCKET] Redux action dispatched successfully`);
            } else {
              console.warn('⚠️ [SOCKET] Invalid messages_read data:', data);
            }
          });

          // ✅ FIX: User typing event - include roomId
          chatSocketClient.on('user_typing', (data) => {
            console.log('✅ [SOCKET] user_typing:', data);
            
            // ✅ FIX: Don't show own typing indicator
            if (data.userId === user?._id) {
              console.log(`⏭️ [SOCKET] Skipping own typing indicator`);
              return;
            }

            // ✅ Always dispatch - let component filter by activeRoomId
            if (data.isTyping) {
              dispatch(addTypingUser({
                userId: data.userId,
                roomId: data.roomId
              }));

              // ✅ FIX: Auto-remove typing indicator after 3 seconds
              setTimeout(() => {
                dispatch(removeTypingUser({
                  userId: data.userId,
                  roomId: data.roomId
                }));
              }, 3000);
            } else {
              dispatch(removeTypingUser({
                userId: data.userId,
                roomId: data.roomId
              }));
            }
          });

          // ✅ Online users event
          chatSocketClient.on('online_users', (data) => {
            console.log('✅ [SOCKET] online_users:', data.users);
            dispatch(setOnlineUsers(data.users || []));
          });

          // ✅ FIX: Room updated event - refetch rooms if in same room
          chatSocketClient.on('room_updated', (data) => {
            console.log('✅ [SOCKET] room_updated:', data);
            // This will trigger a room re-fetch from the component listening
          });

          // ✅ FIX: User went online
          chatSocketClient.on('user_online', (data) => {
            console.log('✅ [SOCKET] user_online:', data.userId);
          });

          // ✅ FIX: User went offline
          chatSocketClient.on('user_offline', (data) => {
            console.log('✅ [SOCKET] user_offline:', data.userId);
          });

          globalListenersInitialized = true;
          console.log('✅ [SOCKET] Listeners initialized successfully');
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
    globalListenersInitialized = false; // ✅ FIX: Reset flag on disconnect
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