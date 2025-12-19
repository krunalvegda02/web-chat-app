import { format } from 'date-fns';
import { Avatar, Tooltip, Dropdown, Modal, Input, message as antMessage, Button, Image } from 'antd';
import {
  CheckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  FileTextOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useDispatch } from 'react-redux';
import { editMessage, deleteMessage } from '../../redux/slices/chatSlice';
import { chatSocketClient } from '../../sockets/chatSocketClient';


/**
 * ✅ ENHANCED MessageBubble Component - WhatsApp Style with Tailwind CSS
 */
export default function MessageBubble({
  message,
  currentUser,
  showAvatar, // eslint-disable-line no-unused-vars
  onEdit,
  onDelete,
}) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [previewImage, setPreviewImage] = useState(null);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  // ✅ Determine if message is from current user
  const messageSenderId = typeof message.senderId === 'object' && message.senderId?._id
    ? message.senderId._id
    : (message.senderId || message.sender?._id);
  const isMine = messageSenderId === currentUser?._id || message.sender?._id === currentUser?._id;

  // ✅ Status icons - WhatsApp style (white for sent messages)
  const statusConfig = useMemo(() => {
    const status = message.status || 'sent';
    const configs = {
      sending: {
        icon: (
          <ClockCircleOutlined className="text-xs text-white opacity-80" />
        ),
        label: 'Sending...',
      },
      sent: {
        icon: (
          <CheckOutlined className="text-xs text-white opacity-90" />
        ),
        label: 'Sent',
      },
      delivered: {
        icon: (
          <span className="inline-flex relative">
            <CheckOutlined className="text-xs text-white opacity-90 -mr-1.5" />
            <CheckOutlined className="text-xs text-white opacity-90" />
          </span>
        ),
        label: 'Delivered',
      },
      read: {
        icon: (
          <span className="inline-flex relative">
            <CheckOutlined className="text-xs text-blue-500 opacity-100" />
            <CheckOutlined className="text-xs text-blue-500 opacity-100 -ml-1.5" />
          </span>
        ),
        label: 'Read',
      },
    };
    return configs[status] || configs.sent;
  }, [message.status]);

  // ✅ Dynamic border radius from theme
  const bubbleRadius = {
    rounded: `${theme.messageBorderRadius}px`,
    square: '4px',
    pill: '24px',
  }[theme.bubbleStyle] || `${theme.messageBorderRadius}px`;

  // ✅ Format time - WhatsApp style (12-hour format)
  const formatTime = (date) => {
    const messageDate = new Date(date);
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // ✅ Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // ✅ Get file icon based on mime type
  const getFileIcon = (mimeType, fileName) => {
    if (!mimeType && !fileName) return <FileOutlined />;

    const mime = mimeType?.toLowerCase() || '';
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';

    if (mime.includes('pdf') || ext === 'pdf') return <FilePdfOutlined className="text-red-500" />;
    if (mime.includes('word') || ext === 'doc' || ext === 'docx') return <FileWordOutlined className="text-blue-500" />;
    if (mime.includes('excel') || ext === 'xls' || ext === 'xlsx') return <FileExcelOutlined className="text-green-500" />;
    if (mime.includes('zip') || ext === 'zip' || ext === 'rar') return <FileZipOutlined className="text-yellow-500" />;
    if (mime.includes('text') || ext === 'txt') return <FileTextOutlined className="text-purple-500" />;
    return <FileOutlined style={{ color: theme.primaryColor }} />;
  };

  // ✅ Get file name from URL
  const getFileName = (url) => {
    try {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1].split('?')[0];
    } catch {
      return 'file';
    }
  };

  // ✅ Handle image preview
  const handleImageClick = (url) => {
    setPreviewImage(url);
    setImagePreviewVisible(true);
  };

  // ✅ Handle file download
  const handleFileDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || getFileName(url);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ Get sender info
  const sender = message.sender || (typeof message.senderId === 'object' && message.senderId ? {
    _id: message.senderId._id,
    name: message.senderId.name || 'Unknown User',
    avatar: message.senderId.avatar || null,
    email: message.senderId.email,
    role: message.senderId.role,
  } : {
    _id: typeof message.senderId === 'string' ? message.senderId : message.senderId?._id,
    name: 'Unknown User',
    avatar: null,
  });

  // ✅ Handle system messages
  if (message.type === 'system') {
    return (
      <div className="text-center py-2 px-4 mb-3 text-xs italic" style={{ color: theme.borderColor }}>
        {message.content}
      </div>
    );
  }

  // ✅ Handle deleted messages
  if (message.deletedAt || message.isDeleted) {
    return (
      <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div
          className="opacity-50 italic py-2 px-4 text-xs rounded-lg"
          style={{
            color: theme.borderColor,
            borderRadius: bubbleRadius,
            backgroundColor: theme.secondaryColor,
          }}
        >
          This message was deleted
        </div>
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

    chatSocketClient.emit('edit_message', {
      messageId: message._id,
      content: editContent.trim(),
    });

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
        chatSocketClient.emit('delete_message', { messageId: message._id });
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

  // Dynamic styles for theme
  const bubbleStyle = {
    borderRadius: bubbleRadius,
    backgroundColor: isMine ? theme.chatBubbleAdmin : theme.chatBubbleUser,
    color: isMine ? theme.chatBubbleAdminText : theme.chatBubbleUserText,
    fontSize: `${theme.messageFontSize}px`,
  };

  const maxWidthClass = message.type === 'image' || message.type === 'video'
    ? 'max-w-[280px]'
    : message.type === 'file'
      ? 'min-w-[250px]'
      : 'max-w-[60%]';

  return (
    <div className={`flex mb-3 gap-2 items-end ${isMine ? 'justify-end' : 'justify-start'}`}>
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
          title={format(new Date(message.createdAt), 'PPpp')}
          placement={isMine ? 'left' : 'right'}
        >
          <div
            className={`relative ${maxWidthClass} transition-all shadow-sm hover:shadow-md ${menuItems.length > 0 ? 'cursor-context-menu' : 'cursor-default'}`}
            style={{ ...bubbleStyle, wordWrap: 'break-word' }}
          >
            {/* Sender name for other users */}
            {!isMine && (
              <div className="text-xs font-semibold mb-1.5 opacity-90 pt-2 px-3">
                {sender.name}
              </div>
            )}

            {/* ✅ IMAGE MESSAGES - WhatsApp Style */}
            {message.type === 'image' && message.media && message.media.length > 0 && (
              <div className="relative">
                {message.media.length === 1 ? (
                  <div className="relative overflow-hidden" style={{ borderRadius: `${bubbleRadius} ${bubbleRadius} 0 0` }}>
                    <img
                      src={message.media[0].thumbnail || message.media[0].url}
                      alt="message image"
                      onClick={() => handleImageClick(message.media[0].url)}
                      className="w-[250px] max-w-full h-auto block cursor-pointer"
                      style={{ borderRadius: `${bubbleRadius} ${bubbleRadius} 0 0` }}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="grid gap-0.5 overflow-hidden"
                    style={{
                      gridTemplateColumns: message.media.length === 2 ? '1fr 1fr' : message.media.length === 3 ? '1fr 1fr' : 'repeat(2, 1fr)',
                      borderRadius: `${bubbleRadius} ${bubbleRadius} 0 0`,
                      width: message.media.length === 1 ? '250px' : message.media.length === 2 ? '300px' : '250px',
                    }}
                  >
                    {message.media.slice(0, 4).map((m, i) => (
                      <div
                        key={i}
                        className="relative cursor-pointer"
                        style={{ paddingTop: '100%', backgroundColor: theme.secondaryColor }}
                        onClick={() => handleImageClick(m.url)}
                      >
                        <img
                          src={m.thumbnail || m.url}
                          alt={`image ${i + 1}`}
                          className="absolute top-0 left-0 w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        {message.media.length > 4 && i === 3 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                            +{message.media.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {message.content && (
                  <div className={`px-3 pb-2 bg-black/5 ${isMine ? 'pr-20' : 'pr-16'}`}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ VIDEO MESSAGES - WhatsApp Style */}
            {message.type === 'video' && message.media && message.media.length > 0 && (
              <div>
                {message.media.map((m, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden ${i < message.media.length - 1 ? 'mb-2' : ''}`}
                    style={{
                      borderRadius: i === 0 ? `${bubbleRadius} ${bubbleRadius} 0 0` : '0',
                      width: '250px',
                      maxWidth: '100%',
                    }}
                  >
                    <video
                      src={m.url}
                      controls
                      preload="metadata"
                      poster={m.thumbnail}
                      className="w-full h-auto block"
                      style={{ borderRadius: i === 0 ? `${bubbleRadius} ${bubbleRadius} 0 0` : '0' }}
                    />
                  </div>
                ))}
                {message.content && (
                  <div className={`px-3 pb-2 bg-black/5 ${isMine ? 'pr-20' : 'pr-16'}`}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ AUDIO MESSAGES */}
            {message.type === 'audio' && message.media && message.media.length > 0 && (
              <div className="p-3">
                {message.media.map((m, i) => (
                  <div key={i} className={i < message.media.length - 1 ? 'mb-3' : ''}>
                    <div className="flex items-center gap-3">
                      <SoundOutlined className="text-2xl opacity-80" />
                      <audio src={m.url} controls className="flex-1" />
                    </div>
                    {m.size && (
                      <div className="text-[11px] opacity-70 mt-1">
                        {formatFileSize(m.size)}
                      </div>
                    )}
                  </div>
                ))}
                {message.content && (
                  <div className={`mt-2 pt-2 border-t ${isMine ? 'border-white/20' : 'border-black/10'} pb-2 ${isMine ? 'pr-20' : 'pr-16'}`}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ FILE MESSAGES */}
            {message.type === 'file' && message.media && message.media.length > 0 && (
              <div className="p-3">
                {message.media.map((m, i) => {
                  const fileName = getFileName(m.url);
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors mb-2 ${isMine ? 'bg-white/10 hover:bg-white/15' : 'bg-black/5 hover:bg-black/8'}`}
                      onClick={() => handleFileDownload(m.url, fileName)}
                    >
                      <div className="text-[32px]">
                        {getFileIcon(m.mimeType, fileName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {fileName}
                        </div>
                        {m.size && (
                          <div className="text-[11px] opacity-70 mt-0.5">
                            {formatFileSize(m.size)}
                          </div>
                        )}
                      </div>
                      <DownloadOutlined className="text-lg opacity-70" />
                    </div>
                  );
                })}
                {message.content && (
                  <div className={`mt-2 pt-2 border-t ${isMine ? 'border-white/20' : 'border-black/10'} pb-2 ${isMine ? 'pr-20' : 'pr-16'}`}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ TEXT MESSAGES WITH MEDIA (Mixed) - WhatsApp Style */}
            {message.type === 'text' && message.media && message.media.length > 0 && (
              <div className="pt-2 px-3">
                <div className={`flex flex-wrap gap-1 ${message.content ? 'mb-2' : ''}`}>
                  {message.media.map((m, i) => (
                    <div key={i}>
                      {m.type === 'image' && (
                        <img
                          src={m.thumbnail || m.url}
                          alt="attachment"
                          onClick={() => handleImageClick(m.url)}
                          className="w-[120px] h-[120px] rounded-lg cursor-pointer object-cover border transition-opacity hover:opacity-90"
                          style={{ borderColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      {m.type === 'video' && (
                        <div className="relative w-[120px] h-[120px]">
                          <video
                            src={m.url}
                            preload="metadata"
                            poster={m.thumbnail}
                            className="w-full h-full rounded-lg object-cover border"
                            style={{ borderColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
                          />
                          <PlayCircleOutlined className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[32px] text-white bg-black/50 rounded-full p-2" />
                        </div>
                      )}
                      {m.type === 'file' && (
                        <div
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer min-w-[120px] ${isMine ? 'bg-white/15' : 'bg-black/8'}`}
                          onClick={() => handleFileDownload(m.url, getFileName(m.url))}
                        >
                          {getFileIcon(m.mimeType, getFileName(m.url))}
                          <div className="text-[11px] truncate flex-1">
                            {getFileName(m.url)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {message.content && (
                  <div className={`px-0 pb-2 mt-2 ${isMine ? 'pr-20' : 'pr-16'}`}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ PURE TEXT MESSAGES */}
            {message.type === 'text' && (!message.media || message.media.length === 0) && message.content && (
              <div className={`px-3 py-2 pb-2 ${isMine ? 'pr-20' : 'pr-16'}`}>
                {message.content}
              </div>
            )}

            {/* Reactions display */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="mt-1.5 text-sm flex gap-1 flex-wrap">
                {message.reactions.map((r, i) => (
                  <span
                    key={i}
                    title={`Reacted by ${r.userId}`}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>
            )}

            {/* ✅ WhatsApp-style Overlay: Time, Status, Edited indicator */}
            <div className={`absolute bottom-2 flex items-center gap-1.5 text-[11px] pointer-events-none z-10 ${isMine ? 'right-2.5' : 'right-2'}`}>
              {/* Edited indicator */}
              {message.isEdited && (
                <span
                  className={`text-[11px] italic mr-1 ${isMine ? 'text-white' : 'text-black/70'}`}
                  style={{
                    opacity: isMine ? 0.9 : 0.7,
                    textShadow: isMine
                      ? '0 1px 3px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)'
                      : '0 1px 2px rgba(255,255,255,0.9)',
                  }}
                >
                  Edited
                </span>
              )}

              {/* Time */}
              <span
                className={`text-[11px] font-normal tracking-wide select-none whitespace-nowrap ${isMine ? 'text-white' : 'text-black/70'}`}
                style={{
                  opacity: isMine ? 0.9 : 0.7,
                  textShadow: isMine
                    ? '0 1px 3px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)'
                    : '0 1px 2px rgba(255,255,255,0.9)',
                }}
              >
                {formatTime(message.createdAt)}
              </span>
           

              {/* Status icon for own messages */}
              {isMine && theme.showReadStatus && (
                <span
                  className={`inline-flex items-center ml-1 text-xs  ${message.status === "read" ? "text-blue-400" : "text-gray-400"}`}
                >
                  {statusConfig.icon}
                </span>
              )}
            </div>
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
        title={
          <div className="flex items-center gap-2">
            <EditOutlined style={{ color: theme.primaryColor }} />
            <span>Edit Message</span>
          </div>
        }
        open={isEditModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setIsEditModalOpen(false)}
        okText="Save Changes"
        cancelText="Cancel"
        okButtonProps={{ 
          style: { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor },
          disabled: !editContent.trim() || editContent === message.content
        }}
        width={500}
      >
        <div className="space-y-3">
          <div className="text-sm opacity-70">Original message:</div>
          <div 
            className="p-3 rounded-lg text-sm italic"
            style={{ 
              backgroundColor: theme.secondaryColor,
              color: theme.textColor,
              maxHeight: '100px',
              overflowY: 'auto'
            }}
          >
            {message.content}
          </div>
          
          <div className="text-sm opacity-70 mt-4">New message:</div>
          <Input.TextArea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            placeholder="Edit your message..."
            autoFocus
            maxLength={5000}
            showCount
            style={{
              fontSize: '14px',
              borderColor: theme.borderColor
            }}
          />
          
          {editContent.trim() && editContent !== message.content && (
            <div className="text-xs opacity-60 flex items-center gap-1">
              <CheckOutlined style={{ color: theme.primaryColor }} />
              Message will be marked as edited
            </div>
          )}
        </div>
      </Modal>

      {/* ✅ Image Preview Modal */}
      {previewImage && (
        <Image
          width={200}
          style={{ display: 'none' }}
          src={previewImage}
          preview={{
            visible: imagePreviewVisible,
            src: previewImage,
            onVisibleChange: (value) => {
              setImagePreviewVisible(value);
              if (!value) setPreviewImage(null);
            },
          }}
        />
      )}
    </div>
  );
}
