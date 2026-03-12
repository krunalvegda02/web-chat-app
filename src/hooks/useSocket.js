
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
  updateRoomUnreadCount,
  editMessage,
  deleteMessage,
  deleteMessageForMe,
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
    // We only skip if there is NO token. We no longer use a problematic regex to skip.
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
            console.log('📦 [SOCKET] Current user role:', user?.role);
            console.log('📦 [SOCKET] Dispatching socketMessageReceived for room:', data?.roomId);

            if (data && data.roomId) {
              // ✅ FIX: Ensure status is 'sent' for immediate tick mark
              const messageWithStatus = {
                ...data,
                status: data.status || 'sent'
              };

              dispatch(socketMessageReceived({
                roomId: data.roomId,
                message: messageWithStatus
              }));
              console.log('✅ [SOCKET] Message added to Redux state with status:', messageWithStatus.status);

              // 🔔 Dispatch custom event for notification
              window.dispatchEvent(new CustomEvent('socket_message', {
                detail: { type: 'message_received', message: messageWithStatus }
              }));
              console.log('🔔 [SOCKET] Dispatched socket_message event for notifications');

              // ✅ Auto-mark as read if message is from someone else, we're viewing this room, AND tab is visible
              const state = window.__REDUX_STORE__?.getState();
              const activeRoomId = state?.chat?.activeRoomId;
              const currentUserId = user?._id?.toString() || user?._id;
              const senderId = data.senderId?.toString() || data.senderId;

              console.log('📦 [SOCKET] Auto-read check:', { activeRoomId, currentUserId, senderId, match: activeRoomId === data.roomId, differentSender: senderId !== currentUserId, documentVisible: !document.hidden });

              if (activeRoomId === data.roomId && senderId !== currentUserId && !document.hidden) {
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
              console.log(`📦 [SOCKET] Dispatching updateMessageStatus for message ${data.messageId} to delivered`);
              dispatch(updateMessageStatus({
                roomId: data.roomId,
                messageId: data.messageId,
                status: 'delivered'
              }));
            }
          });

          // ✅ FIX: Messages read event with proper roomId
          chatSocketClient.on('messages_read', (data) => {
            console.log('👁️👁️👁️ [SOCKET] ========== messages_read EVENT RECEIVED ==========');
            console.log('👁️ [SOCKET] Full data:', JSON.stringify(data, null, 2));
            console.log('👁️ [SOCKET] Room ID:', data?.roomId);
            console.log('👁️ [SOCKET] Message IDs:', data?.messageIds);
            console.log('👁️ [SOCKET] Read by:', data?.readBy);

            if (data && data.roomId && data.messageIds && data.messageIds.length > 0) {
              console.log(`👁️ [SOCKET] ✅ Valid data - Dispatching updateMessagesReadStatus for ${data.messageIds.length} messages`);
              console.log('👁️ [SOCKET] Current Redux state before update:', window.__REDUX_STORE__?.getState()?.chat?.messagesByRoom[data.roomId]);

              dispatch(updateMessagesReadStatus({
                roomId: data.roomId,
                messageIds: data.messageIds
              }));

              console.log(`✅ [SOCKET] Redux action dispatched - messages should now show as read`);
              console.log('👁️ [SOCKET] Current Redux state after update:', window.__REDUX_STORE__?.getState()?.chat?.messagesByRoom[data.roomId]);
            } else {
              console.error('❌ [SOCKET] Invalid messages_read data:', {
                hasData: !!data,
                hasRoomId: !!data?.roomId,
                hasMessageIds: !!data?.messageIds,
                messageIdsLength: data?.messageIds?.length
              });
            }
            console.log('👁️👁️👁️ [SOCKET] ========== END messages_read ==========');
          });

          // ✅ FIX: User typing event - include roomId
          chatSocketClient.on('user_typing', (data) => {
            console.log('✅ [SOCKET] user_typing:', data);

            // ✅ FIX: Don't show own typing indicator (compare both string and object)
            const currentUserId = user?._id?.toString() || user?._id;
            const typingUserId = data.userId?.toString() || data.userId;

            if (currentUserId === typingUserId) {
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

          // ✅ Online users event (initial list)
          chatSocketClient.on('online_users', (data) => {
            console.log('✅ [SOCKET] online_users:', data.users);
            dispatch(setOnlineUsers(data.users || []));
          });

          // ✅ FIX: Room updated event - refetch rooms if in same room
          chatSocketClient.on('room_updated', (data) => {
            console.log('✅ [SOCKET] room_updated:', data);
            // This will trigger a room re-fetch from the component listening
          });

          // ✅ Room created event - refetch rooms
          chatSocketClient.on('room_created', (data) => {
            console.log('✅ [SOCKET] room_created:', data);
            // Dispatch custom event to trigger room list refresh
            window.dispatchEvent(new CustomEvent('room_created', { detail: data }));
          });

          // ✅ Room deleted event - refetch rooms and clear active room
          chatSocketClient.on('room_deleted', (data) => {
            console.log('🗑️ [SOCKET] room_deleted:', data);
            // Dispatch custom event to trigger room list refresh
            window.dispatchEvent(new CustomEvent('room_deleted', { detail: data }));
          });

          // ✅ User status changed (online/offline)
          chatSocketClient.on('user_status_changed', (data) => {
            console.log(`✅ [SOCKET] user_status_changed: ${data.userId} is now ${data.status}`);
            // Trigger a re-fetch of online users or update local state
            if (data.status === 'online') {
              const state = window.__REDUX_STORE__?.getState();
              const currentOnlineUsers = state?.chat?.onlineUsers || [];
              if (!currentOnlineUsers.includes(data.userId)) {
                dispatch(setOnlineUsers([...currentOnlineUsers, data.userId]));
              }
            } else if (data.status === 'offline') {
              const state = window.__REDUX_STORE__?.getState();
              const currentOnlineUsers = state?.chat?.onlineUsers || [];
              dispatch(setOnlineUsers(currentOnlineUsers.filter(id => id !== data.userId)));
            }
          });

          // ✅ Unread count updated
          chatSocketClient.on('unread_count_updated', (data) => {
            console.log('🔔 [SOCKET] unread_count_updated:', data);
            if (data && data.roomId) {
              dispatch(updateRoomUnreadCount({
                roomId: data.roomId,
                unreadCount: data.unreadCount
              }));
            }
          });

          // ✅ Message edited
          chatSocketClient.on('message_edited', (data) => {
            console.log('✏️ [SOCKET] message_edited:', data);
            if (data && data.messageId) {
              dispatch(editMessage({
                messageId: data.messageId,
                content: data.content,
                editedAt: data.editedAt
              }));
            }
          });

          // ✅ Message deleted
          chatSocketClient.on('message_deleted', (data) => {
            console.log('🗑️ [SOCKET] message_deleted:', data);
            if (data && data.messageId) {
              dispatch(deleteMessage({
                messageId: data.messageId,
                deletedAt: data.deletedAt
              }));
            }
          });

          // ✅ Message deleted for me
          chatSocketClient.on('message_deleted_for_me', (data) => {
            console.log('🗑️ [SOCKET] message_deleted_for_me:', data);
            if (data && data.messageId && data.userId) {
              dispatch(deleteMessageForMe({
                messageId: data.messageId,
                userId: data.userId
              }));
            }
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
