
import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { chatSocketClient } from '../sockets/chatSocketClient';
import { forceLogout } from '../utils/authUtils';
import {
  socketMessageReceived,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
  updateMessageStatus,
  updateMessagesReadStatus,
  updateMessageTranslation,
  setMessageTranslating,
  updateRoomUnreadCount,
  editMessage,
  deleteMessage,
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

              // 🔔 Dispatch notification only if: message is from someone else AND room belongs to current user
              const _currentUserId = user?._id?.toString();
              const _senderId = data.senderId?._id?.toString() || data.senderId?.toString();
              const _state = window.__REDUX_STORE__?.getState();
              const _userRoomIds = (_state?.chat?.rooms || []).map(r => r._id?.toString());
              const _isMyRoom = _userRoomIds.some(id => id === data.roomId?.toString());
              if (_senderId && _senderId !== _currentUserId && _isMyRoom) {
                window.dispatchEvent(new CustomEvent('socket_message', {
                  detail: { type: 'message_received', message: messageWithStatus }
                }));
              }

              // ✅ Auto-mark as read logic - ONLY for messages that are actually being viewed
              const state = window.__REDUX_STORE__?.getState();
              const activeRoomId = state?.chat?.activeRoomId;
              const currentUserId = user?._id?.toString() || user?._id;
              const senderId = data.senderId?.toString() || data.senderId;

              console.log('📦 [SOCKET] Auto-read check:', { activeRoomId, currentUserId, senderId, match: activeRoomId === data.roomId, differentSender: senderId !== currentUserId, documentVisible: !document.hidden });

              // ONLY auto-mark as read if:
              // 1. User is actively viewing the specific room where message was received
              // 2. Message is from someone else (not own message)
              // 3. Document/tab is visible (user is actually looking at it)
              // 4. NOT in read-only mode (like admin monitoring)
              const shouldAutoMarkRead = (
                activeRoomId === data.roomId &&
                senderId !== currentUserId &&
                !document.hidden &&
                user?.role !== 'PLATFORM_ADMIN' // Platform admins shouldn't auto-mark as read
              );

              if (shouldAutoMarkRead) {
                // Mark this specific message as read after a delay
                setTimeout(() => {
                  chatSocketClient.emit('mark_messages_read', {
                    roomId: data.roomId,
                    messageIds: [data._id]
                  });
                  console.log(`📖 [AUTO] Auto-marked message ${data._id} as read (user actively viewing room)`);
                }, 1000); // Increased delay to ensure user actually sees the message
              }
            }
          });

          // ✅ FIX: Message sent event (emit by server after send succeeds) with immediate status update
          chatSocketClient.on('message_sent', (data) => {
            console.log('✅ [SOCKET] message_sent RECEIVED:', data);
            if (data && (data.tempId || data.messageId) && data.roomId) {
              console.log(`📦 [SOCKET] Reconciling optimistic message ${data.tempId} with DB ID ${data.messageId}`);
              dispatch(updateMessageStatus({
                roomId: data.roomId,
                messageId: data.tempId || data.messageId,
                status: data.status || 'sent',
                newId: data.messageId // ✅ Pass the permanent ID
              }));

              // Force immediate UI update
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('message_status_updated', {
                  detail: { roomId: data.roomId, messageId: data.messageId, status: data.status }
                }));
              }, 50);
            }
          });

          // ✅ Message delivered event with immediate UI update
          chatSocketClient.on('message_delivered', (data) => {
            console.log('✅ [SOCKET] message_delivered RECEIVED:', data);
            if (data && data.messageId && data.roomId) {
              console.log(`📦 [SOCKET] Updating message ${data.messageId} to delivered`);
              dispatch(updateMessageStatus({
                roomId: data.roomId,
                messageId: data.messageId,
                status: 'delivered'
              }));

              // Force immediate UI update
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('message_status_updated', {
                  detail: { roomId: data.roomId, messageId: data.messageId, status: 'delivered' }
                }));
              }, 50);
            }
          });

          // ✅ FIX: Messages read event with proper roomId and immediate UI update
          chatSocketClient.on('messages_read', (data) => {
            console.log('👁️👁️👁️ [SOCKET] ========== messages_read EVENT RECEIVED ==========');
            console.log('👁️ [SOCKET] Full data:', JSON.stringify(data, null, 2));
            console.log('👁️ [SOCKET] Room ID:', data?.roomId);
            console.log('👁️ [SOCKET] Message IDs:', data?.messageIds);
            console.log('👁️ [SOCKET] Read by:', data?.readBy);

            if (data && data.roomId && data.messageIds && data.messageIds.length > 0) {
              console.log(`👁️ [SOCKET] ✅ Valid data - Dispatching updateMessagesReadStatus for ${data.messageIds.length} messages`);
              console.log('👁️ [SOCKET] Current Redux state before update:', window.__REDUX_STORE__?.getState()?.chat?.messagesByRoom[data.roomId]);

              // Immediately update Redux state
              dispatch(updateMessagesReadStatus({
                roomId: data.roomId,
                messageIds: data.messageIds
              }));

              // Force a React re-render by dispatching a timestamp update
              setTimeout(() => {
                const currentState = window.__REDUX_STORE__?.getState();
                const messages = currentState?.chat?.messagesByRoom[data.roomId] || [];
                console.log(`👁️ [SOCKET] Post-update verification - ${messages.filter(m => data.messageIds.includes(m._id) && m.status === 'read').length}/${data.messageIds.length} messages now marked as read`);

                // Trigger a custom event to force UI refresh if needed
                window.dispatchEvent(new CustomEvent('messages_read_updated', {
                  detail: { roomId: data.roomId, messageIds: data.messageIds }
                }));
              }, 100);

              console.log(`✅ [SOCKET] Redux action dispatched - messages should now show as read`);
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

            const userId = data.userId?.toString();
            if (!userId) return;

            // Trigger a re-fetch of online users or update local state
            if (data.status === 'online') {
              const state = window.__REDUX_STORE__?.getState();
              const currentOnlineUsers = state?.chat?.onlineUsers || [];
              const isAlreadyOnline = currentOnlineUsers.some(id => id.toString() === userId);

              if (!isAlreadyOnline) {
                dispatch(setOnlineUsers([...currentOnlineUsers, userId]));
              }
            } else if (data.status === 'offline') {
              const state = window.__REDUX_STORE__?.getState();
              const currentOnlineUsers = state?.chat?.onlineUsers || [];
              dispatch(setOnlineUsers(currentOnlineUsers.filter(id => id.toString() !== userId)));
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

          // ✅ Message translated (on-demand)
          chatSocketClient.on('message_translated', (data) => {
            console.log('🌐 [SOCKET] message_translated received:', data);
            if (data && data.messageId && data.roomId && data.translation) {
              dispatch(setMessageTranslating({ messageId: data.messageId, loading: false }));
              dispatch(updateMessageTranslation({
                roomId: data.roomId,
                messageId: data.messageId,
                translation: data.translation,
              }));
            }
          });

          // ✅ Message deleted
          chatSocketClient.on('message_deleted', (data) => {
            console.log('🗑️ [SOCKET] message_deleted:', data);
            if (data && data.messageId) {
              dispatch(deleteMessage({
                messageId: data.messageId,
                deletedAt: data.deletedAt,
                userId: data.deleteType === 'forMe' ? data.userId : null
              }));
            }
          });

          // ✅ Force disconnect (account deactivated)
          chatSocketClient.on('force_disconnect', (data) => {
            console.log('🔌 [SOCKET] force_disconnect:', data);
            const reason = data.reason || 'Your account has been deactivated. You will be logged out.';
            forceLogout(reason);
          });

          // ✅ Auth error (token invalid/expired)
          chatSocketClient.on('auth_error', (data) => {
            console.log('❌ [SOCKET] auth_error:', data);
            
            // Only show alert if it's not a normal token expiry
            if (data.message && data.message.includes('deactivated')) {
              forceLogout(data.message);
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
