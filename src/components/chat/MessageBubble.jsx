import { format } from 'date-fns';
import { Avatar, Tooltip, Dropdown, Modal, Input, message as antMessage } from 'antd';
import {
  CheckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useDispatch } from 'react-redux';
import { editMessage, deleteMessage } from '../../redux/slices/chatSlice';
import { chatSocketClient } from '../../sockets/chatSocketClient';


/**
 * ✅ ENHANCED MessageBubble Component (HYBRID - BEST OF BOTH)
 * 
 * Features:
 * ✅ Full theme support (colors, radius, font size)
 * ✅ Edit/delete functionality with modal
 * ✅ Reactions display
 * ✅ Status tracking (sending/sent/delivered/read)
 * ✅ Media support (images/videos) - ADDED
 * ✅ Avatar display with sender name
 * ✅ Context menu (right-click)
 * ✅ Professional UI with transitions
 * ✅ Proper socket integration
 * ✅ Redux state management
 * ✅ Error handling & validation
 */
export default function MessageBubble({
  message,
  currentUser,
  showAvatar = true,
  onEdit,
  onDelete,
}) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
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


  // ✅ Handle edit message
  const handleEdit = () => {
    setEditContent(message.content);
    setIsEditModalOpen(true);
  };


  const handleEditSubmit = () => {
    if (!editContent.trim()) {
      antMessage.error('Message cannot be empty');
      return;
    }
    
    if (editContent === message.content) {
      setIsEditModalOpen(false);
      return;
    }

    // Emit socket event
    chatSocketClient.emit('edit_message', {
      messageId: message._id,
      content: editContent.trim(),
    });

    // Update Redux state
    dispatch(editMessage({ messageId: message._id, content: editContent.trim() }));
    
    setIsEditModalOpen(false);
    antMessage.success('Message edited');
  };


  // ✅ Handle delete message
  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Message',
      content: 'Are you sure you want to delete this message?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        // Emit socket event
        chatSocketClient.emit('delete_message', { messageId: message._id });
        
        // Update Redux state
        dispatch(deleteMessage({ messageId: message._id }));
        
        antMessage.success('Message deleted');
      },
    });
  };


  // ✅ Context menu items
  const menuItems = [
    isMine && {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: onEdit || handleEdit,
    },
    isMine && {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: onDelete || handleDelete,
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


            {/* ✅ MEDIA SUPPORT - Images & Videos */}
            {message.media && message.media.length > 0 && (
              <div
                style={{
                  marginBottom: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {message.media.map((m, i) => (
                  <div key={i}>
                    {m.type === 'image' && (
                      <img
                        src={m.url}
                        alt="message media"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          border: `1px solid ${isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    {m.type === 'video' && (
                      <video
                        src={m.url}
                        controls
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '6px',
                          border: `1px solid ${isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                      />
                    )}
                    {m.type === 'audio' && (
                      <audio
                        src={m.url}
                        controls
                        style={{
                          maxWidth: '200px',
                          marginTop: '4px',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}


            {/* Message content */}
            {message.content && (
              <div style={{ margin: 0 }}>{message.content}</div>
            )}


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
                (edited {message.editedAt ? format(new Date(message.editedAt), 'HH:mm') : ''})
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
                  <span 
                    key={i} 
                    title={`Reacted by ${r.userId}`}
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
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


      {/* ✅ Edit Modal */}
      <Modal
        title="Edit Message"
        open={isEditModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setIsEditModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
      >
        <Input.TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          placeholder="Edit your message..."
          autoFocus
        />
      </Modal>
    </div>
  );
}