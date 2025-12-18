import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';


export default function OnlineStatus({
  userId,
  isOnline = null,
  size = 'sm',
  showLabel = false,
}) {
  const { theme } = useTheme();
  const { userOnlineStatus } = useSelector((s) => s.chat);

  // ✅ Size classes for all options
  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  // ✅ Get status from Redux or direct prop
  const statusInfo = useMemo(() => {
    // If isOnline prop provided directly, use it
    if (isOnline !== null) {
      return {
        isOnline,
        label: isOnline ? 'online' : 'offline',
        lastSeen: null,
      };
    }

    // Otherwise, lookup from Redux
    if (!userId) {
      return { isOnline: false, label: 'offline', lastSeen: null };
    }

    const status = userOnlineStatus?.[userId];
    if (!status) {
      return { isOnline: false, label: 'offline', lastSeen: null };
    }

    return {
      isOnline: status.isOnline,
      label: status.isOnline ? 'online' : 'offline',
      lastSeen: status.lastSeen,
    };
  }, [userId, isOnline, userOnlineStatus]);

  // ✅ Theme colors
  const onlineColor = theme?.onlineStatusColor || '#10b981'; // emerald-500
  const offlineColor = theme?.offlineStatusColor || '#9ca3af'; // gray-400
  const glowColor = theme?.onlineStatusGlowColor || 'rgba(16, 185, 129, 0.5)'; // emerald glow

  // ✅ Hide if offline and no label requested
  if (!statusInfo.isOnline && !showLabel) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* ✅ Online Status Indicator */}
      <div
        className={`${sizeClasses[size]} rounded-full border border-white shadow-md transition-all duration-200 ${
          statusInfo.isOnline ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: statusInfo.isOnline ? onlineColor : offlineColor,
          boxShadow: statusInfo.isOnline
            ? `0 0 8px ${glowColor}, 0 0 12px ${glowColor}`
            : 'none',
        }}
        title={statusInfo.label}
      />

      {/* ✅ Optional Label */}
      {showLabel && (
        <div className="flex flex-col gap-0.5">
          <span
            className="text-xs font-medium"
            style={{
              color: statusInfo.isOnline ? onlineColor : offlineColor,
            }}
          >
            {statusInfo.label}
          </span>

          {/* ✅ Last seen info (if offline) */}
          {!statusInfo.isOnline && statusInfo.lastSeen && (
            <span
              className="text-xs opacity-70"
              style={{
                color: theme?.secondaryText || '#6b7280',
              }}
            >
              {new Date(statusInfo.lastSeen).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}