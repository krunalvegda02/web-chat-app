import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { chatSocketClient } from '../sockets/chatSocketClient';

/**
 * Custom hook for real-time room list updates
 * Handles WhatsApp-like behavior: move rooms to top when new messages arrive
 */
export const useRealTimeRoomList = () => {
  const dispatch = useDispatch();
  const { rooms, activeRoomId } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);

  // Update room list with new message - OPTIMIZED for speed
  const updateRoomWithMessage = useCallback((messageData) => {
    if (!messageData || !messageData.roomId) return;

    // Use functional update to avoid stale closure issues
    dispatch((dispatch, getState) => {
      const currentState = getState();
      const currentRooms = currentState.chat.rooms;
      const roomsArray = Array.isArray(currentRooms) ? [...currentRooms] : [];
      const roomIndex = roomsArray.findIndex(r => r._id === messageData.roomId);
      
      if (roomIndex === -1) {
        console.warn(`⚠️ [REALTIME] Room ${messageData.roomId} not found`);
        return;
      }

      const room = { ...roomsArray[roomIndex] };
      
      // Update room with new message info - INSTANT
      room.lastMessage = messageData;
      room.lastMessageTime = messageData.createdAt || new Date().toISOString();
      room.lastMessagePreview = messageData.content?.substring(0, 50) || '';
      
      // Handle unread count logic - FAST
      const currentUserId = currentState.auth.user?._id?.toString();
      const senderId = messageData.senderId?._id?.toString() || messageData.senderId?.toString();
      const isFromOtherUser = senderId !== currentUserId;
      const isRoomActive = currentState.chat.activeRoomId === messageData.roomId;
      
      if (isFromOtherUser && !isRoomActive) {
        room.unreadCount = (room.unreadCount || 0) + 1;
      }
      
      // Move to top INSTANTLY - no splice if already at top
      if (roomIndex === 0) {
        roomsArray[0] = room;
      } else {
        roomsArray.splice(roomIndex, 1);
        roomsArray.unshift(room);
      }
      
      // IMMEDIATE Redux update
      dispatch({ 
        type: 'chat/fetchRooms/fulfilled', 
        payload: { data: { rooms: roomsArray } }
      });
      
      console.log(`⚡ [REALTIME] INSTANT room update: ${room.name || room._id}`);
    });
  }, [dispatch]);

  // Update room unread count - OPTIMIZED
  const updateRoomUnreadCount = useCallback((data) => {
    if (!data || !data.roomId) return;
    
    dispatch((dispatch, getState) => {
      const currentRooms = getState().chat.rooms;
      const roomsArray = Array.isArray(currentRooms) ? [...currentRooms] : [];
      const roomIndex = roomsArray.findIndex(r => r._id === data.roomId);
      
      if (roomIndex !== -1) {
        roomsArray[roomIndex] = {
          ...roomsArray[roomIndex],
          unreadCount: data.unreadCount || 0
        };
        
        dispatch({ 
          type: 'chat/fetchRooms/fulfilled', 
          payload: { data: { rooms: roomsArray } } 
        });
        
        console.log(`⚡ [REALTIME] INSTANT unread update: ${data.roomId} = ${data.unreadCount}`);
      }
    });
  }, [dispatch]);

  // Update room data - OPTIMIZED
  const updateRoomData = useCallback((data) => {
    if (!data || !data.roomId) return;
    
    dispatch((dispatch, getState) => {
      const currentRooms = getState().chat.rooms;
      const roomsArray = Array.isArray(currentRooms) ? [...currentRooms] : [];
      const roomIndex = roomsArray.findIndex(r => r._id === data.roomId);
      
      if (roomIndex !== -1) {
        roomsArray[roomIndex] = {
          ...roomsArray[roomIndex],
          ...data.updates
        };
        
        dispatch({ 
          type: 'chat/fetchRooms/fulfilled', 
          payload: { data: { rooms: roomsArray } } 
        });
        
        console.log(`⚡ [REALTIME] INSTANT room data update: ${data.roomId}`);
      }
    });
  }, [dispatch]);

  // Setup socket listeners
  useEffect(() => {
    if (!chatSocketClient.socket) return;

    console.log('🔌 [REALTIME] Setting up room list socket listeners');

    // Listen for new messages
    chatSocketClient.on('message_received', updateRoomWithMessage);
    
    // Listen for unread count updates
    chatSocketClient.on('unread_count_updated', updateRoomUnreadCount);
    
    // Listen for room updates
    chatSocketClient.on('room_updated', updateRoomData);

    // Cleanup listeners
    return () => {
      console.log('🔌 [REALTIME] Cleaning up room list socket listeners');
      chatSocketClient.off('message_received', updateRoomWithMessage);
      chatSocketClient.off('unread_count_updated', updateRoomUnreadCount);
      chatSocketClient.off('room_updated', updateRoomData);
    };
  }, [updateRoomWithMessage, updateRoomUnreadCount, updateRoomData]);

  return {
    updateRoomWithMessage,
    updateRoomUnreadCount,
    updateRoomData
  };
};

export default useRealTimeRoomList;