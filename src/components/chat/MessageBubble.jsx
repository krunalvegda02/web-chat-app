import { format } from 'date-fns';
import { Avatar, Tooltip, Dropdown } from 'antd';
import {
  CheckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';

/**
 * ✅ OPTIMAL MessageBubble Component
 * Combines:
 * - Full theme support (colors, radius, font size)
 * - Edit/delete functionality
 * - Reactions display
 * - Status tracking (sending/sent/delivered/read)
 * - Professional UI
 */
export default function MessageBubble({
  message,
  currentUser,
  showAvatar = true,
  onEdit,
  onDelete,
}) {
  const { theme } = useTheme();
  const isMine =
    message.senderId === currentUser?._id || message.sender?._id === currentUser?._id;

  // ✅ Status icons with theme colors
  const statusConfig = useMemo(() => {
    const status = message.status || 'sent';
    const configs = {
      sending: {
        icon: (
          <ClockCircleOutlined
            style={{ color: theme.chatBubbleAdminText, opacity: 0.6, fontSize: '12px' }}
          />
        ),
        label: 'Sending...',
      },
      sent: {
        icon: (
          <CheckOutlined style={{ color: theme.chatBubbleAdminText, opacity: 0.6, fontSize: '12px' }} />
        ),
        label: 'Sent',
      },
      delivered: {
        icon: (
          <span style={{ display: 'inline-flex', position: 'relative' }}>
            <CheckOutlined style={{ color: theme.chatBubbleAdminText, opacity: 0.6, fontSize: '12px' }} />
            <CheckOutlined style={{ color: theme.chatBubbleAdminText, opacity: 0.6, fontSize: '12px', marginLeft: '-6px' }} />
          </span>
        ),
        label: 'Delivered',
      },
      read: {
        icon: (
          <span style={{ display: 'inline-flex', position: 'relative' }}>
            <CheckOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
            <CheckOutlined style={{ color: '#1890ff', fontSize: '12px', marginLeft: '-6px' }} />
          </span>
        ),
        label: 'Read',
      },
    };
    return configs[status] || configs.sent;
  }, [message.status, theme]);

  // ✅ Dynamic border radius from theme
  const bubbleRadius = {
    rounded: `${theme.messageBorderRadius}px`,
    square: '4px',
    pill: '24px',
  }[theme.bubbleStyle] || `${theme.messageBorderRadius}px`;

  // ✅ Dynamic colors from theme
  const bubbleColor = isMine ? theme.chatBubbleAdmin : theme.chatBubbleUser;
  const textColor = isMine ? theme.chatBubbleAdminText : theme.chatBubbleUserText;

  // ✅ Format time
  const formatTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  // ✅ Get sender info
  const sender = message.sender || {
    _id: message.senderId,
    name: 'Unknown User',
    avatar: null,
  };

  // ✅ Handle deleted messages
  if (message.deletedAt) {
    return (
      <div
        style={{
          opacity: 0.5,
          fontStyle: 'italic',
          color: theme.borderColor,
          padding: '8px',
          marginBottom: '12px',
        }}
      >
        This message was deleted
      </div>
    );
  }

  // ✅ Context menu items
  const menuItems = [
    isMine && {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => onEdit?.(message),
    },
    isMine && {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => onDelete?.(message._id),
      danger: true,
    },
  ].filter(Boolean);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        gap: '8px',
        alignItems: 'flex-end',
      }}
    >
      {/* ✅ Avatar for other users */}
      {!isMine && theme.showAvatars && (
        <Avatar
          size={32}
          src={sender.avatar}
          style={{ backgroundColor: theme.accentColor }}
        >
          {sender.name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
      )}

      {/* ✅ Message bubble with context menu */}
      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
        <Tooltip
          title={format(new Date(message.createdAt), 'HH:mm:ss')}
          placement={isMine ? 'left' : 'right'}
        >
          <div
            style={{
              maxWidth: '60%',
              padding: '8px 12px',
              borderRadius: bubbleRadius,
              backgroundColor: bubbleColor,
              color: textColor,
              wordWrap: 'break-word',
              position: 'relative',
              cursor: menuItems.length > 0 ? 'context-menu' : 'default',
              fontSize: `${theme.messageFontSize}px`,
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
            className="hover:shadow-md"
          >
            {/* Sender name for other users */}
            {!isMine && (
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '4px',
                  opacity: 0.8,
                }}
              >
                {sender.name}
              </div>
            )}

            {/* Message content */}
            <div style={{ margin: 0 }}>{message.content}</div>

            {/* Edited indicator */}
            {message.isEdited && (
              <div
                style={{
                  fontSize: '11px',
                  marginTop: '4px',
                  opacity: 0.7,
                  fontStyle: 'italic',
                }}
              >
                (edited)
              </div>
            )}

            {/* Time and status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '4px',
                fontSize: '11px',
                opacity: 0.7,
              }}
            >
              <span>{formatTime(message.createdAt)}</span>
              {/* Show read status for own messages if theme allows */}
              {isMine && theme.showReadStatus && statusConfig.icon}
            </div>

            {/* Reactions display */}
            {message.reactions && message.reactions.length > 0 && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '14px',
                  display: 'flex',
                  gap: '4px',
                  flexWrap: 'wrap',
                }}
              >
                {message.reactions.map((r, i) => (
                  <span key={i} title={`Reacted by ${r.userId}`}>
                    {r.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Tooltip>
      </Dropdown>

      {/* ✅ Avatar for current user */}
      {isMine && theme.showAvatars && (
        <Avatar
          size={32}
          src={currentUser?.avatar}
          style={{ backgroundColor: theme.accentColor }}
        >
          {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
      )}
    </div>
  );
}