import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Avatar from '../common/Avatar';

export default function TypingIndicator({ typingUsers = [] }) {
  const { rooms, activeRoomId } = useSelector((s) => s.chat);

  const typingUserData = useMemo(() => {
    if (!typingUsers || typingUsers.length === 0) return [];

    const roomsArray = Array.isArray(rooms) ? rooms :
      rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];

    const currentRoom = roomsArray.find((r) => r._id === activeRoomId);
    if (!currentRoom) return [];

    return typingUsers
      .map((userId) => {
        const participant = currentRoom.participants?.find(
          (p) => p.userId && (p.userId._id === userId || p.userId === userId)
        );
        return participant?.userId || { _id: userId, name: 'User' };
      })
      .filter(Boolean);
  }, [typingUsers, rooms, activeRoomId]);

  if (!typingUserData || typingUserData.length === 0) return null;

  const userNames = typingUserData.map((u) => u.name).join(', ');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      margin: '8px 0',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#666',
    }}>
      {typingUserData.length > 0 && typingUserData[0] && (
        <Avatar
          name={typingUserData[0].name || 'User'}
          src={typingUserData[0].avatar}
          size={24}
        />
      )}
      <div>
        <span>{userNames}</span>
        <span style={{ marginLeft: '4px' }}>
          typing
          <span className="dot-animation">.</span>
          <span className="dot-animation">.</span>
          <span className="dot-animation">.</span>
        </span>
      </div>

      <style>{`
        @keyframes blink {
          0%, 20%, 50%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
          60% { opacity: 0.5; }
        }
        .dot-animation {
          animation: blink 1.4s infinite;
        }
      `}</style>
    </div>
  );
}
