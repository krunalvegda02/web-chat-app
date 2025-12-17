import { format } from 'date-fns';
import Avatar from '../common/Avatar';
import { CheckOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useMemo } from 'react';

export default function MessageBubble({ message, currentUser, showAvatar = true }) {
  const isMine = message.senderId === currentUser?._id || message.sender?._id === currentUser?._id;

  const statusConfig = useMemo(() => {
    const status = message.status || 'sent';
    const configs = {
      sent: {
        icon: <ClockCircleOutlined />,
        label: 'Sending...',
        color: 'text-gray-400',
      },
      delivered: {
        icon: <CheckOutlined />,
        label: 'Delivered',
        color: 'text-blue-500',
      },
      read: {
        icon: <CheckCircleOutlined />,
        label: 'Read',
        color: 'text-blue-600',
      },
    };
    return configs[status] || configs.sent;
  }, [message.status]);

  const formattedTime = format(new Date(message.createdAt), 'HH:mm');

  return (
    <div
      className={`flex gap-2 mb-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {showAvatar && !isMine && (
        <div className="flex-shrink-0">
          <Avatar
            name={message.sender?.name || 'Unknown'}
            size={36}
            src={message.sender?.avatar}
          />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender Name */}
        {!isMine && (
          <div className="text-xs font-semibold text-gray-600 mb-1 ml-2">
            {message.sender?.name}
            {message.sender?.role === 'ADMIN' && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                Admin
              </span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-2.5 rounded-lg max-w-md break-words ${
            isMine
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Message Meta */}
        <div
          className={`flex items-center gap-1.5 mt-1 text-xs ${
            isMine ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span className="text-gray-500">{formattedTime}</span>
          {isMine && (
            <span
              className={`flex items-center gap-0.5 ${statusConfig.color}`}
              title={statusConfig.label}
            >
              {statusConfig.icon}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
