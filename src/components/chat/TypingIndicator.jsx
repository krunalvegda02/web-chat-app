import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Avatar from '../common/Avatar';

export default function TypingIndicator({ typingUsers = [] }) {
  const { rooms, activeRoomId } = useSelector((s) => s.chat);

  const typingUserData = useMemo(() => {
    if (!typingUsers || typingUsers.length === 0) {
      return [];
    }

    const roomsArray = Array.isArray(rooms)
      ? rooms
      : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];
    const currentRoom = roomsArray.find((r) => r._id === activeRoomId);

    if (!currentRoom) return [];

    return typingUsers
      .map((userId) => {
        const participant = currentRoom.participants?.find(
          (p) =>
            p.userId &&
            (p.userId._id === userId || p.userId === userId)
        );
        return participant?.userId || { _id: userId, name: 'User' };
      })
      .filter(Boolean);
  }, [typingUsers, rooms, activeRoomId]);

  if (!typingUserData || typingUserData.length === 0) {
    return null;
  }

  const firstUser = typingUserData;
  const userNames = typingUserData.map((u) => u.name).join(', ');

  return (
    <div className="flex gap-3 items-end px-4 py-2 animate-fade-in">
      {/* Avatar */}
      <Avatar name={firstUser.name} size={28} />

      {/* Typing Bubble */}
      <div className="px-3 py-1.5 rounded-2xl bg-gray-100">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
              style={{
                animation: `bounce 1.4s infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Label */}
      <span className="text-xs text-gray-500 italic">
        {userNames} is typing<span className="animate-pulse">...</span>
      </span>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            opacity: 0.5;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-6px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
