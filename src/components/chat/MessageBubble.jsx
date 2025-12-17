import { format } from 'date-fns';
import Avatar from '../common/Avatar';
import { CheckOutlined, CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { Button, Space, Dropdown } from 'antd';

export default function MessageBubble({
  message,
  currentUser,
  showAvatar = true,
  onEdit,
  onDelete,
}) {
  const isMine = message.senderId === currentUser?._id || message.sender?._id === currentUser?._id;

  const statusIcon = useMemo(() => {
    const status = message.status || 'sending';
    const configs = {
      sending: {
        icon: <ClockCircleOutlined style={{ color: '#999' }} />,
        tooltip: 'Sending...',
      },
      sent: {
        icon: <CheckOutlined style={{ color: '#999' }} />,
        tooltip: 'Sent',
      },
      delivered: {
        icon: <CheckOutlined style={{ color: '#999' }} />,
        tooltip: 'Delivered',
      },
      read: {
        icon: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
        tooltip: 'Read',
      },
    };
    return configs[status] || configs.sent;
  }, [message.status]);

  const formatTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const sender = message.sender || {
    _id: message.senderId,
    name: 'Unknown User',
    avatar: null,
  };

  if (message.deletedAt) {
    return (
      <div style={{
        opacity: 0.5,
        fontStyle: 'italic',
        color: '#999',
        padding: '8px',
      }}>
        This message was deleted
      </div>
    );
  }

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
      }}
    >
      {!isMine && showAvatar && (
        <Avatar
          name={sender.name}
          avatar={sender.avatar}
          size={32}
        />
      )}

      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
        <div
          style={{
            maxWidth: '60%',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: isMine ? '#1890ff' : '#f0f0f0',
            color: isMine ? '#fff' : '#000',
            wordWrap: 'break-word',
            position: 'relative',
          }}
        >
          {!isMine && (
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px',
              opacity: 0.8,
            }}>
              {sender.name}
            </div>
          )}

          <div>{message.content}</div>

          {message.isEdited && (
            <div style={{
              fontSize: '11px',
              marginTop: '4px',
              opacity: 0.7,
              fontStyle: 'italic',
            }}>
              (edited)
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
            fontSize: '11px',
            opacity: 0.7,
          }}>
            <span>{formatTime(message.createdAt)}</span>
            {isMine && statusIcon.icon}
          </div>

          {message.reactions && message.reactions.length > 0 && (
            <div style={{
              marginTop: '6px',
              fontSize: '14px',
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
            }}>
              {message.reactions.map((r, i) => (
                <span key={i}>{r.emoji}</span>
              ))}
            </div>
          )}
        </div>
      </Dropdown>
    </div>
  );
}
