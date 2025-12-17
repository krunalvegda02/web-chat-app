import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function OnlineStatus({ userId, size = 'sm', showLabel = false }) {
  const { userOnlineStatus } = useSelector((s) => s.chat);

  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const statusInfo = useMemo(() => {
    const status = userOnlineStatus[userId];
    if (!status) return { isOnline: false, label: 'offline' };

    return {
      isOnline: status.isOnline,
      label: status.isOnline ? 'online' : 'offline',
      lastSeen: status.lastSeen,
    };
  }, [userId, userOnlineStatus]);

  if (!statusInfo.isOnline && !showLabel) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Online Indicator */}
      <div
        className={`${sizeClasses[size]} rounded-full animate-pulse ${
          statusInfo.isOnline
            ? 'bg-green-500 shadow-lg shadow-green-500/50'
            : 'bg-gray-400'
        }`}
        title={statusInfo.label}
      />

      {/* Optional Label */}
      {showLabel && (
        <span
          className={`text-xs font-medium ${
            statusInfo.isOnline ? 'text-green-600' : 'text-gray-500'
          }`}
        >
          {statusInfo.label}
        </span>
      )}
    </div>
  );
}
