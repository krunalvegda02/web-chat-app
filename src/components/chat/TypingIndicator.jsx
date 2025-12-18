
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
        padding: '8px 12px',
        backgroundColor: theme?.backgroundColor || '#f5f5f5',
        borderTop: `1px solid ${theme?.borderColor || '#e0e0e0'}`,
        fontSize: '12px',
        color: theme?.textSecondary || '#666666',
      }}
    >
      {/* Typing dots animation */}
      <div style={{ display: 'flex', gap: '3px' }}>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: theme?.primaryColor || '#1890ff',
            animation: 'bounce 1.4s infinite ease-in-out',
          }}
        />
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: theme?.primaryColor || '#1890ff',
            animation: 'bounce 1.4s infinite ease-in-out 0.2s',
          }}
        />
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: theme?.primaryColor || '#1890ff',
            animation: 'bounce 1.4s infinite ease-in-out 0.4s',
          }}
        />
      </div>

      <span>
        <strong>{userNames}</strong> {verb} typing...
      </span>

      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(1); }
            40% { transform: scale(1.3); }
          }
        `}
      </style>
    </div>
  );
}