
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Avatar from '../common/Avatar';
import { useTheme } from '../../hooks/useTheme';

export default function TypingIndicator() {
  const { theme } = useTheme();
  const { rooms, activeRoomId, typingUsers } = useSelector((s) => s.chat);

  // ✅ FIX: Get typing users for CURRENT ROOM ONLY
  const typingUserData = useMemo(() => {
    if (!activeRoomId || !typingUsers) return [];

    // ✅ FIX: Get typing users for current room only
    const roomTypingUserIds = typingUsers[activeRoomId] || [];

    if (roomTypingUserIds.length === 0) return [];

    // ✅ Get room details
    const roomsArray = Array.isArray(rooms)
      ? rooms
      : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];

    const currentRoom = roomsArray.find((r) => r._id === activeRoomId);

    if (!currentRoom) return [];

    // ✅ Map typing user IDs to user data
    return roomTypingUserIds
      .map((userId) => {
        const participant = currentRoom.participants?.find(
          (p) => p.userId && (p.userId._id === userId || p.userId === userId)
        );
        return participant?.userId || { _id: userId, name: 'User' };
      })
      .filter(Boolean);
  }, [activeRoomId, typingUsers, rooms]);

  // ✅ FIX: Don't show if no typing users
  if (!typingUserData || typingUserData.length === 0) return null;

  // ✅ Format user names with proper grammar
  const userNames = typingUserData.map((u) => u.name).join(', ');
  const isPlural = typingUserData.length > 1;
  const verb = isPlural ? 'are' : 'is';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: '#F0F2F5',
        fontSize: '13px',
        color: '#6B7280',
      }}
    >
      {/* Typing dots animation - WhatsApp style */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            animation: 'bounce 1.4s infinite ease-in-out',
          }}
        />
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            animation: 'bounce 1.4s infinite ease-in-out 0.2s',
          }}
        />
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            animation: 'bounce 1.4s infinite ease-in-out 0.4s',
          }}
        />
      </div>

      <span style={{ fontWeight: '400' }}>
        {userNames} {verb} typing...
      </span>

      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: translateY(0); 
              opacity: 0.7;
            }
            40% { 
              transform: translateY(-4px); 
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}