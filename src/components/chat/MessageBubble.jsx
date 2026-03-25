import { format } from 'date-fns';
import { Tooltip, Dropdown, Modal, Input, message as antMessage, Button, Image, Slider, Checkbox } from 'antd';
import Avatar from '../common/Avatar';
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
  CaretRightOutlined,
  PauseOutlined,
  AudioOutlined,
  ShareAltOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useDispatch, useSelector } from 'react-redux';
import { editMessage, deleteMessage, setMessageTranslating } from '../../redux/slices/chatSlice';
import { chatSocketClient } from '../../sockets/chatSocketClient';
import ForwardMessageModal from './ForwardMessageModal';


/**
 * ✅ ENHANCED MessageBubble Component - WhatsApp Style with Tailwind CSS
 */
export default function MessageBubble({
  message,
  currentUser,
  showAvatar,
  onEdit,
  onDelete,
  searchQuery = '',
  translationLanguage = null,
  isTranslating = false,
}) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [previewImage, setPreviewImage] = useState(null);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [audioStates, setAudioStates] = useState({});
  const audioRefs = useRef({});
  const [showOriginal, setShowOriginal] = useState(false);

  const handleTranslate = (e) => {
    e.stopPropagation();
    if (!translationLanguage || isTranslating) return;
    const msgId = message._id?.toString?.() || message._id;
    dispatch(setMessageTranslating({ messageId: msgId, loading: true }));
    chatSocketClient.emit('translate_message', { messageId: msgId, targetLanguage: translationLanguage });
  };

 
  // Check if user is a platform user (but not platform admin)
  const isPlatformUser = useMemo(() => {
    const hasExternalId = !!currentUser?.externalUserId;
    const hasPlatformId = !!currentUser?.platformId;
    const isUserRole = currentUser?.role === 'USER';
    const isPlatformAdmin = currentUser?.role === 'PLATFORM_ADMIN';
    return isUserRole && (hasExternalId || hasPlatformId) && !isPlatformAdmin;
  }, [currentUser]);

  const isPlatformAdmin = currentUser?.role === 'PLATFORM_ADMIN';

  // Highlight search text
  const highlightText = (text) => {
    if (!searchQuery || !text) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} style={{ backgroundColor: '#FFEB3B', padding: '2px 0', borderRadius: '2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  // ✅ Determine if message is from current user
  const messageSenderId = typeof message.senderId === 'object' && message.senderId?._id
    ? message.senderId._id
    : (message.senderId || message.sender?._id);
  const isMine = messageSenderId === currentUser?._id || message.sender?._id === currentUser?._id;

  // Has any translation stored (regardless of current selected language)
  const hasTranslation = message.translation?.isTranslated &&
    message.translation?.translatedContent;

  // Only show translate button if language selected and no translation yet for that language
  const canTranslate = !!translationLanguage &&
    !isMine &&
    (message.type === 'text' || message.type === 'audio' || message.type === 'voice') &&
    (message.content?.trim().length > 0 || !!message.translation?.transcription);

  const alreadyTranslatedForLang = hasTranslation &&
    message.translation?.targetLanguage === translationLanguage;

  // ✅ Status icons - WhatsApp style (white for sent messages) with real-time updates
  const statusConfig = useMemo(() => {
    const status = (message.status || 'sent').toLowerCase();
    // ✅ Enhanced logging for real-time debugging
    console.log(`📊 [MessageBubble] ID: ${message._id}, Status: ${status}, Optimistic: ${!!message.optimistic}, UpdatedAt: ${message._updatedAt}`);
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
            <CheckOutlined className="text-xs opacity-100" style={{ color: '#53BDEB' }} />
            <CheckOutlined className="text-xs opacity-100 -ml-1.5" style={{ color: '#53BDEB' }} />
          </span>
        ),
        label: 'Read',
      },
    };
    return configs[status] || configs.sent;
  }, [message.status, message._id, message._updatedAt, message.optimistic]);

  // ✅ Dynamic border radius from theme
  const bubbleRadius = isMine
    ? `${theme.senderBubbleRadius || 8}px`
    : `${theme.receiverBubbleRadius || 8}px`;

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

  // ✅ Get download URL - Only Cloudinary URLs, skip local URLs
  const getDownloadUrl = (url) => {
    if (!url || url.includes('/api/v1/uploads/') || url.includes('localhost') || url.includes('127.0.0.1')) {
      return null;
    }

    if (url.includes('cloudinary.com')) {
      // For PDFs, use fl_attachment with proper filename
      if (url.includes('.pdf')) {
        const fileName = url.split('/').pop().split('?')[0];
        return url.replace('/upload/', `/upload/fl_attachment:${fileName}/`);
      }
      // For raw files (old uploads), convert to image URL
      if (url.includes('/raw/upload/')) {
        return url.replace('/raw/upload/', '/image/upload/fl_attachment/');
      }
      // For image/video files, add fl_attachment
      return url.replace('/upload/', '/upload/fl_attachment/');
    }

    return url;
  };

  // ✅ Handle document download programmatically
  const handleDocumentDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  // ✅ Audio player controls
  const toggleAudioPlay = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    if (audioStates[audioId]?.isPlaying) {
      audio.pause();
    } else {
      // Pause all other audios
      Object.keys(audioRefs.current).forEach(id => {
        if (id !== audioId && audioRefs.current[id]) {
          audioRefs.current[id].pause();
        }
      });
      audio.play();
    }
  };

  const handleAudioTimeUpdate = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    setAudioStates(prev => ({
      ...prev,
      [audioId]: {
        ...prev[audioId],
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      }
    }));
  };

  const handleAudioEnded = (audioId) => {
    setAudioStates(prev => ({
      ...prev,
      [audioId]: {
        ...prev[audioId],
        isPlaying: false,
        currentTime: 0,
      }
    }));
  };

  const handleAudioPlay = (audioId) => {
    setAudioStates(prev => ({
      ...prev,
      [audioId]: { ...prev[audioId], isPlaying: true }
    }));
  };

  const handleAudioPause = (audioId) => {
    setAudioStates(prev => ({
      ...prev,
      [audioId]: { ...prev[audioId], isPlaying: false }
    }));
  };

  const handleSeek = (audioId, value) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      audio.currentTime = value;
    }
  };

  const formatAudioTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ Reusable download button component
  const DownloadButton = ({ url, fileName, size = 'md' }) => {
    const downloadUrl = getDownloadUrl(url);

    // Don't render button for local URLs
    if (!downloadUrl) return null;

    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-7 h-7',
      lg: 'w-8 h-8'
    };

    const iconSizes = {
      sm: 'text-[10px]',
      md: 'text-xs',
      lg: 'text-sm'
    };

    return (
      <a
        href={downloadUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-2 right-2 ${sizeClasses[size]} rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all opacity-100 pointer-events-auto`}
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <DownloadOutlined className={`text-white ${iconSizes[size]}`} />
      </a>
    );
  };

  // ✅ Check if URL is downloadable (Cloudinary only)
  const isDownloadable = (url) => {
    return getDownloadUrl(url) !== null;
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

  // ✅ Handle messages deleted for me (should not be rendered)
  if (message.deletedForUsers && (message.deletedForUsers.includes(currentUser?._id) || message.deletedForUsers.includes(currentUser?._id?.toString()))) {
    return null;
  }

  // ✅ Handle messages deleted for everyone (show placeholder)
  if (message.deletedAt || message.isDeleted) {
    return (
      <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div
          className="opacity-60 italic py-2 px-3 text-sm rounded-lg"
          style={{
            color: '#667781',
            borderRadius: bubbleRadius,
            backgroundColor: isMine ? '#DCF8C6' : '#FFFFFF',
            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
          }}
        >
          <DeleteOutlined style={{ marginRight: '6px', fontSize: '12px' }} />
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

  // ✅ Handle delete message - WhatsApp style with proper delete for me vs delete for everyone
  const handleDelete = () => {
    if (!message?._id || !currentUser?._id) {
      console.error('❌ [MessageBubble] Cannot delete message - missing message ID or user ID');
      antMessage.error('Unable to delete message');
      return;
    }

    Modal.confirm({
      title: null,
      icon: null,
      content: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#111B21', marginBottom: '8px' }}>
            Delete message?
          </div>
          <div style={{ fontSize: '14px', color: '#667781', lineHeight: '20px' }}>
            {/* Empty - buttons will be in footer */}
          </div>
        </div>
      ),
      okText: 'DELETE FOR EVERYONE',
      cancelText: 'DELETE FOR ME',
      okButtonProps: {
        style: {
          backgroundColor: 'transparent',
          border: 'none',
          color: '#EA4335',
          fontWeight: 500,
          fontSize: '14px',
          height: '48px',
          boxShadow: 'none',
          textTransform: 'uppercase',
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = '#F5F5F5';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
        },
      },
      cancelButtonProps: {
        style: {
          backgroundColor: 'transparent',
          border: 'none',
          color: '#EA4335',
          fontWeight: 500,
          fontSize: '14px',
          height: '48px',
          boxShadow: 'none',
          textTransform: 'uppercase',
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = '#F5F5F5';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
        },
      },
      width: 320,
      centered: true,
      closable: false,
      maskClosable: true,
      styles: {
        body: { padding: '24px 24px 8px' },
        footer: { padding: '0', marginTop: '0', borderTop: 'none' },
      },
      footer: (_, { OkBtn, CancelBtn }) => (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ borderTop: '1px solid #E9EDEF' }}>
            <CancelBtn />
          </div>
          <div style={{ borderTop: '1px solid #E9EDEF' }}>
            <OkBtn />
          </div>
          <div style={{ borderTop: '1px solid #E9EDEF' }}>
            <button
              onClick={() => Modal.destroyAll()}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#008069',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#F5F5F5';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      ),
      onOk: () => {
        try {
          // Delete for everyone
          console.log('🗑️ [MessageBubble] Deleting message for everyone:', message._id);
          chatSocketClient.emit('delete_message', { messageId: message._id, deleteType: 'forEveryone' });
          dispatch(deleteMessage({ messageId: message._id }));
          antMessage.success('Message deleted for everyone');
        } catch (error) {
          console.error('❌ [MessageBubble] Error deleting message for everyone:', error);
          antMessage.error('Failed to delete message');
        }
      },
      onCancel: () => {
        try {
          // Delete for me only
          console.log('🗑️ [MessageBubble] Deleting message for user:', { messageId: message._id, userId: currentUser._id });
          chatSocketClient.emit('delete_message', { messageId: message._id, deleteType: 'forMe', userId: currentUser._id });
          dispatch(deleteMessage({ messageId: message._id, userId: currentUser._id }));
          antMessage.success('Message deleted for you');
        } catch (error) {
          console.error('❌ [MessageBubble] Error deleting message for user:', error);
          antMessage.error('Failed to delete message');
        }
      },
    });
  };

  // ✅ Handle forward message
  const handleForward = () => {
    if (!message?._id) {
      console.error('❌ [MessageBubble] Cannot forward message - missing message ID');
      antMessage.error('Unable to forward message');
      return;
    }

    console.log('🚀 [MessageBubble] Opening forward modal for message:', message._id);
    setIsForwardModalOpen(true);
  };

  // ✅ Context menu items - WhatsApp style
  // Only allow edit for text messages without media
  const canEdit = message.type === 'text' && (!message.media || message.media.length === 0);

  // Hide all context menu options for platform users
  const menuItems = isPlatformUser ? [] : [
    {
      key: 'forward',
      label: (
        <div className="flex items-center gap-2">
          <ShareAltOutlined />
          <span>Forward</span>
        </div>
      ),
      onClick: handleForward,
    },
    ...(isMine && canEdit ? [{
      key: 'edit',
      label: (
        <div className="flex items-center gap-2">
          <EditOutlined />
          <span>Edit</span>
        </div>
      ),
      onClick: handleEdit,
    }] : []),
    ...(isMine ? [{
      key: 'delete',
      label: (
        <div className="flex items-center gap-2">
          <DeleteOutlined />
          <span>Delete</span>
        </div>
      ),
      onClick: handleDelete,
      danger: true,
    }] : []),
  ];

  // WhatsApp-style bubble colors
  const bubbleStyle = {
    borderRadius: bubbleRadius,
    backgroundColor: isMine ? (theme.senderBubbleColor || '#DCF8C6') : (theme.receiverBubbleColor || '#FFFFFF'),
    color: isMine ? (theme.senderTextColor || '#111827') : (theme.receiverTextColor || '#111827'),
    fontSize: '14.2px',
    boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
  };

  const maxWidthClass = message.type === 'image' || message.type === 'video'
    ? 'max-w-[280px]'
    : message.type === 'file'
      ? 'min-w-[250px]'
      : 'max-w-[75%] sm:max-w-[60%]';

  return (
    <div
      className={`flex mb-3 gap-2 items-end group ${isMine ? 'justify-end' : 'justify-start'}`}
      data-message-id={message._id}
      data-message-status={message.status}
      data-message-sender={messageSenderId}
    >
      {/* ✅ Avatar for other users */}
      {!isMine && (
        <Avatar
          size={32}
          src={sender.avatar}
          name={sender.name}
        />
      )}

      {/* ✅ Forward button - left side for my messages - Hidden for platform users */}
      {isMine && !isPlatformUser && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleForward();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-white shadow-md hover:bg-gray-50 flex items-center justify-center self-end mb-1"
          style={{ border: '1px solid #E9EDEF' }}
          title="Forward message"
        >
          <ShareAltOutlined style={{ fontSize: '14px', color: '#54656F' }} />
        </button>
      )}

      {/* ✅ Message bubble with context menu */}
      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
          <div
            className={`relative ${maxWidthClass} transition-all shadow-sm hover:shadow-md ${menuItems.length > 0 ? 'cursor-context-menu' : 'cursor-default'}`}
            style={{ ...bubbleStyle, wordWrap: 'break-word' }}
          >
            {/* Sender name for other users - WhatsApp style */}
            {!isMine && (
              <div className="text-xs font-semibold mb-1 pt-2 px-3" style={{ color: '#10B981' }}>
                {sender.name}
              </div>
            )}

            {/* ✅ IMAGE MESSAGES - WhatsApp Style */}
            {message.type === 'image' && message.media && message.media.length > 0 && (
              <div className="relative">
                {(message.isForwarded || message.forwarded) && (
                  <div className="px-3 pt-2 pb-1 flex items-center gap-1 text-xs italic" style={{ color: '#667781', backgroundColor: 'rgba(0,0,0,0.03)', marginBottom: '2px' }}>
                    <ShareAltOutlined style={{ fontSize: '10px' }} />
                    <span>Forwarded</span>
                  </div>
                )}
                {message.media.length === 1 ? (
                  // Single image
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
                    <DownloadButton url={message.media[0].url} fileName={`image_${Date.now()}.jpg`} size="lg" />
                  </div>
                ) : message.media.length === 2 ? (
                  // Two images - side by side
                  <div className="grid grid-cols-2 gap-0.5" style={{ width: '300px', maxWidth: '100%' }}>
                    {message.media.map((m, i) => (
                      <div
                        key={i}
                        className="relative cursor-pointer overflow-hidden"
                        style={{
                          paddingTop: '100%',
                          borderRadius: i === 0 ? `${bubbleRadius} 0 0 0` : `0 ${bubbleRadius} 0 0`
                        }}
                        onClick={() => handleImageClick(m.url)}
                      >
                        <img
                          src={m.thumbnail || m.url}
                          alt={`image ${i + 1}`}
                          className="absolute top-0 left-0 w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        <DownloadButton url={m.url} fileName={`image_${i + 1}_${Date.now()}.jpg`} size="md" />
                      </div>
                    ))}
                  </div>
                ) : message.media.length === 3 ? (
                  // Three images - 1 large + 2 small
                  <div className="grid gap-0.5" style={{ width: '300px', maxWidth: '100%' }}>
                    <div
                      className="relative cursor-pointer overflow-hidden group"
                      style={{ paddingTop: '66.67%', borderRadius: `${bubbleRadius} ${bubbleRadius} 0 0` }}
                      onClick={() => handleImageClick(message.media[0].url)}
                    >
                      <img
                        src={message.media[0].thumbnail || message.media[0].url}
                        alt="image 1"
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <a
                        href={getDownloadUrl(message.media[0].url)}
                        download={`image_1_${Date.now()}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all opacity-100"
                        style={{ backdropFilter: 'blur(4px)' }}
                      >
                        <DownloadOutlined className="text-white text-xs" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-0.5">
                      {message.media.slice(1, 3).map((m, i) => (
                        <div
                          key={i}
                          className="relative cursor-pointer overflow-hidden group"
                          style={{ paddingTop: '100%' }}
                          onClick={() => handleImageClick(m.url)}
                        >
                          <img
                            src={m.thumbnail || m.url}
                            alt={`image ${i + 2}`}
                            className="absolute top-0 left-0 w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <a
                            href={getDownloadUrl(m.url)}
                            download={`image_${i + 2}_${Date.now()}.jpg`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all opacity-100"
                            style={{ backdropFilter: 'blur(4px)' }}
                          >
                            <DownloadOutlined className="text-white text-[10px]" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Four or more images - 2x2 grid with +N overlay
                  <div className="grid grid-cols-2 gap-0.5" style={{ width: '300px', maxWidth: '100%' }}>
                    {message.media.slice(0, 4).map((m, i) => (
                      <div
                        key={i}
                        className="relative cursor-pointer overflow-hidden group"
                        style={{
                          paddingTop: '100%',
                          borderRadius: i === 0 ? `${bubbleRadius} 0 0 0` : i === 1 ? `0 ${bubbleRadius} 0 0` : '0'
                        }}
                        onClick={() => handleImageClick(m.url)}
                      >
                        <img
                          src={m.thumbnail || m.url}
                          alt={`image ${i + 1}`}
                          className="absolute top-0 left-0 w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        {message.media.length > 4 && i === 3 ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold">
                            +{message.media.length - 4}
                          </div>
                        ) : (
                          <a
                            href={getDownloadUrl(m.url)}
                            download={`image_${i + 1}_${Date.now()}.jpg`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all opacity-100"
                            style={{ backdropFilter: 'blur(4px)' }}
                          >
                            <DownloadOutlined className="text-white text-[10px]" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {message.content && (
                  <div className="px-3 pb-1 pt-2" style={{ paddingRight: '80px', minWidth: '120px' }}>
                    {highlightText(message.content)}
                  </div>
                )}
              </div>
            )}

            {/* ✅ VIDEO MESSAGES - WhatsApp Style */}
            {message.type === 'video' && message.media && message.media.length > 0 && (
              <div>
                {(message.isForwarded || message.forwarded) && (
                  <div className="px-3 pt-2 pb-1 flex items-center gap-1 text-xs italic" style={{ color: '#667781', backgroundColor: 'rgba(0,0,0,0.03)', marginBottom: '2px' }}>
                    <ShareAltOutlined style={{ fontSize: '10px' }} />
                    <span>Forwarded</span>
                  </div>
                )}
                {message.media.map((m, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden group ${i < message.media.length - 1 ? 'mb-2' : ''}`}
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
                    {/* Download button */}
                    <a
                      href={getDownloadUrl(m.url)}
                      download={`video_${i + 1}_${Date.now()}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all opacity-100"
                      style={{ backdropFilter: 'blur(4px)' }}
                    >
                      <DownloadOutlined className="text-white text-sm" />
                    </a>
                  </div>
                ))}
                {message.content && (
                  <div className="px-3 pb-1 pt-1" style={{ paddingRight: '80px', minWidth: '120px' }}>
                    {highlightText(message.content)}
                  </div>
                )}
              </div>
            )}

            {/* ✅ AUDIO/VOICE MESSAGES - WhatsApp Style */}
            {(message.type === 'audio' || message.type === 'voice') && message.media && message.media.length > 0 && (
              <div className="py-2 px-3">
                {(message.isForwarded || message.forwarded) && (
                  <div className="pb-2 flex items-center gap-1 text-xs italic" style={{ color: '#667781', backgroundColor: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                    <ShareAltOutlined style={{ fontSize: '10px' }} />
                    <span>Forwarded</span>
                  </div>
                )}
                {message.media.map((m, i) => {
                  const audioId = `${message._id}-${i}`;
                  const state = audioStates[audioId] || { isPlaying: false, currentTime: 0, duration: 0 };
                  const isVoiceNote = m.mimeType?.includes('ogg') || m.mimeType?.includes('webm') || m.isVoiceNote;

                  return (
                    <div key={i} className={i < message.media.length - 1 ? 'mb-3' : ''}>
                      {isVoiceNote ? (
                        // WhatsApp-style voice note player
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <button
                            onClick={() => toggleAudioPlay(audioId)}
                            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: isMine ? '#FFFFFF' : '#008069',
                              color: isMine ? '#008069' : '#FFFFFF',
                            }}
                          >
                            {state.isPlaying ? (
                              <PauseOutlined className="text-lg" />
                            ) : (
                              <CaretRightOutlined className="text-lg ml-0.5" />
                            )}
                          </button>

                          <div className="flex-1 flex flex-col gap-1">
                            {/* Waveform visualization placeholder - can be replaced with actual waveform */}
                            <div className="flex items-center gap-0.5 h-6">
                              {[...Array(40)].map((_, idx) => {
                                const height = Math.random() * 100;
                                const isPassed = state.duration > 0 && (idx / 40) <= (state.currentTime / state.duration);
                                return (
                                  <div
                                    key={idx}
                                    className="flex-1 rounded-full transition-all"
                                    style={{
                                      height: `${Math.max(20, height)}%`,
                                      backgroundColor: isPassed
                                        ? (isMine ? '#FFFFFF' : '#FFFFFF')
                                        : (isMine ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.2)'),
                                      opacity: isPassed ? 1 : 0.5,
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          <div className="text-[11px] opacity-70 min-w-[35px] text-right">
                            {state.isPlaying || state.currentTime > 0
                              ? formatAudioTime(state.currentTime)
                              : formatAudioTime(state.duration)}
                          </div>

                          <audio
                            ref={el => audioRefs.current[audioId] = el}
                            src={m.url}
                            onTimeUpdate={() => handleAudioTimeUpdate(audioId)}
                            onEnded={() => handleAudioEnded(audioId)}
                            onPlay={() => handleAudioPlay(audioId)}
                            onPause={() => handleAudioPause(audioId)}
                            onLoadedMetadata={() => handleAudioTimeUpdate(audioId)}
                            preload="metadata"
                            className="hidden"
                          />
                        </div>
                      ) : (
                        // Regular audio player
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleAudioPlay(audioId)}
                              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                              style={{
                                backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                              }}
                            >
                              {state.isPlaying ? (
                                <PauseOutlined className="text-lg" />
                              ) : (
                                <CaretRightOutlined className="text-lg ml-0.5" />
                              )}
                            </button>

                            <div className="flex-1 flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <AudioOutlined className="text-sm opacity-70" />
                                <span className="text-xs font-medium">Audio</span>
                              </div>
                              <Slider
                                min={0}
                                max={state.duration || 100}
                                value={state.currentTime}
                                onChange={(value) => handleSeek(audioId, value)}
                                tooltip={{ formatter: formatAudioTime }}
                                trackStyle={{ backgroundColor: isMine ? '#FFFFFF' : '#008069' }}
                                handleStyle={{ borderColor: isMine ? '#FFFFFF' : '#008069' }}
                              />
                            </div>

                            <div className="text-[11px] opacity-70">
                              {formatAudioTime(state.currentTime)} / {formatAudioTime(state.duration)}
                            </div>

                            <audio
                              ref={el => audioRefs.current[audioId] = el}
                              src={m.url}
                              onTimeUpdate={() => handleAudioTimeUpdate(audioId)}
                              onEnded={() => handleAudioEnded(audioId)}
                              onPlay={() => handleAudioPlay(audioId)}
                              onPause={() => handleAudioPause(audioId)}
                              onLoadedMetadata={() => handleAudioTimeUpdate(audioId)}
                              preload="metadata"
                              className="hidden"
                            />
                          </div>
                          {m.size && (
                            <div className="text-[11px] opacity-70">
                              {formatFileSize(m.size)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {message.content && (
                  <div className="mt-2 pt-2 border-t pb-1" style={{ borderColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', paddingRight: '80px', minWidth: '120px' }}>
                    {highlightText(message.content)}
                  </div>
                )}

                {/* Translation for audio/voice */}
                {canTranslate && (
                  <div className="mx-3 mt-1 mb-2">
                    {isTranslating ? (
                      <span className="text-[10px] opacity-50">⌛ Translating voice...</span>
                    ) : alreadyTranslatedForLang ? (
                      <div>
                        {/* Translated audio player */}
                        {message.translation.translatedAudioUrl && !showOriginal && (
                          <div className="mb-1">
                            {/* <div className="text-[10px] opacity-60 mb-0.5">🌐 Translated audio</div> */}
                            <audio
                              controls
                              src={message.translation.translatedAudioUrl}
                              className="w-full h-8"
                              style={{ filter: 'sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(12%)' }}
                              preload="metadata"
                            />
                          </div>
                        )}
                        {/* Translated caption */}
                        {message.translation.translatedContent && !showOriginal && (
                          <div className="text-[12px] italic opacity-80 mb-0.5">{message.translation.translatedContent}</div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setShowOriginal(!showOriginal); }} className="text-[10px] opacity-60 hover:opacity-100 cursor-pointer" style={{ color:  '#008069', background: 'none', border: 'none', padding: 0 }}>
                          {showOriginal ? '🌐 Show translation' : '🌐 Original'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={handleTranslate} className="text-[10px] opacity-60 hover:opacity-100 cursor-pointer" style={{ color: '#008069', background: 'none', border: 'none', padding: 0 }}>
                        🌐 Translate
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ✅ FILE MESSAGES */}
            {message.type === 'file' && message.media && message.media.length > 0 && (
              <div className="p-3 pb-4">
                {(message.isForwarded || message.forwarded) && (
                  <div className="pb-2 flex items-center gap-1 text-xs italic" style={{ color: '#667781', backgroundColor: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                    <ShareAltOutlined style={{ fontSize: '10px' }} />
                    <span>Forwarded</span>
                  </div>
                )}
                {message.media.map((m, i) => {
                  const fileName = m.fileName || getFileName(m.url);
                  const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                  const isCloudinary = m.url.includes('cloudinary.com');

                  return (
                    <div
                      key={i}
                      onClick={() => isCloudinary && handleDocumentDownload(m.url, fileName)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all mb-2 last:mb-0 ${isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-black/5 hover:bg-black/10'} ${isCloudinary ? 'cursor-pointer' : ''}`}
                      style={{ minWidth: '280px', maxWidth: '100%' }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{
                        backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : 'rgba(0,128,105,0.1)'
                      }}>
                        <div className="text-center">
                          <div className="text-[20px] mb-0.5">
                            {getFileIcon(m.mimeType, fileName)}
                          </div>
                          <div className="text-[9px] font-semibold opacity-70">
                            {fileExt}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[14px] truncate mb-0.5">
                          {fileName}
                        </div>
                        {m.size && (
                          <div className="text-[12px] opacity-70">
                            {formatFileSize(m.size)}
                          </div>
                        )}
                      </div>
                      <DownloadOutlined className="text-[20px] opacity-70 flex-shrink-0" />
                    </div>
                  );
                })}
                {message.content && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', paddingRight: '80px', minWidth: '120px' }}>
                    {highlightText(message.content)}
                  </div>
                )}
              </div>
            )}

            {/* ✅ TEXT MESSAGES WITH MEDIA (Mixed) - WhatsApp Style */}
            {message.type === 'text' && message.media && message.media.length > 0 && (
              <div className="pt-2 px-3 pb-2">
                {(message.isForwarded || message.forwarded) && (
                  <div className="pb-2 flex items-center gap-1 text-xs italic" style={{ color: '#667781', backgroundColor: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                    <ShareAltOutlined style={{ fontSize: '10px' }} />
                    <span>Forwarded</span>
                  </div>
                )}
                <div className={`flex flex-wrap gap-1 ${message.content ? 'mb-2' : ''}`}>
                  {message.media.map((m, i) => (
                    <div key={i}>
                      {m.type === 'image' && (
                        <div className="relative">
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
                          <a
                            href={getDownloadUrl(m.url)}
                            download={`image_${i + 1}_${Date.now()}.jpg`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all opacity-100"
                            style={{ backdropFilter: 'blur(4px)' }}
                          >
                            <DownloadOutlined className="text-white text-[10px]" />
                          </a>
                        </div>
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
                          <a
                            href={getDownloadUrl(m.url)}
                            download={`video_${i + 1}_${Date.now()}.mp4`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all opacity-100 z-10"
                            style={{ backdropFilter: 'blur(4px)' }}
                          >
                            <DownloadOutlined className="text-white text-[10px]" />
                          </a>
                        </div>
                      )}
                      {m.type === 'file' && (
                        <a
                          href={getDownloadUrl(m.url)}
                          download={getFileName(m.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg min-w-[120px] ${isMine ? 'bg-white/15 hover:bg-white/25' : 'bg-black/8 hover:bg-black/12'} transition-colors`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getFileIcon(m.mimeType, getFileName(m.url))}
                          <div className="text-[11px] truncate flex-1">
                            {getFileName(m.url)}
                          </div>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                {message.content && (
                  <div className="px-0" style={{ paddingRight: '80px', minWidth: '120px' }}>
                    {highlightText(message.content)}
                  </div>
                )}
              </div>
            )}

            {/* ✅ PURE TEXT MESSAGES */}
            {message.type === 'text' && (!message.media || message.media.length === 0) && message.content && (
              <div>
                {(message.isForwarded || message.forwarded) && (
                  <div className="px-3 pt-1 pb-1 flex items-center gap-1 text-xs italic" style={{ color: '#667781', backgroundColor: 'rgba(0,0,0,0.03)', marginBottom: '2px' }}>
                    <ShareAltOutlined style={{ fontSize: '10px' }} />
                    <span>Forwarded</span>
                  </div>
                )}
                <div className="px-3" style={{ paddingTop: (message.isForwarded || message.forwarded) ? '0' : '0px', paddingBottom: '13px', minWidth: '120px' }}>
                  {/* Show translated or original text */}
                  {alreadyTranslatedForLang && !showOriginal
                    ? highlightText(message.translation.translatedContent)
                    : highlightText(message.content)
                  }
                  {/* Translation status row */}
                  {canTranslate && (
                    <div className="mt-0.5">
                      {isTranslating ? (
                        <span className="text-[10px] opacity-50">⌛ Translating...</span>
                      ) : alreadyTranslatedForLang ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowOriginal(!showOriginal); }}
                          className="text-[10px] opacity-60 hover:opacity-100 cursor-pointer"
                          style={{ color:  '#008069', background: 'none', border: 'none', padding: 0 }}
                        >
                          {showOriginal ? '🌐 Show translation' : '🌐 Original'}
                        </button>
                      ) : (
                        <button
                          onClick={handleTranslate}
                          className="text-[10px] opacity-60 hover:opacity-100 cursor-pointer"
                          style={{ color:  '#008069', background: 'none', border: 'none', padding: 0 }}
                        >
                          🌐 Translate
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
            <div className={`absolute bottom-[0px] flex items-center gap-1 text-[11px] pointer-events-none z-10 ${isMine ? 'right-2.5' : 'right-2'}`}>
              {/* Edited indicator */}
              {message.isEdited && (
                <span
                  className="text-[11px] italic"
                  style={{
                    color: isMine ? (theme?.timestampColor || '#FFFFFF') : (theme?.timestampColor || '#667781'),
                    opacity: isMine ? 0.85 : 0.65,
                    // textShadow: isMine
                    //   ? '0 1px 3px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)'
                    //   : '0 1px 2px rgba(255,255,255,0.9)',
                  }}
                >
                  Edited
                </span>
              )}

              {/* Time */}
              <span
                className="text-[11px] font-normal tracking-wide select-none whitespace-nowrap py-0"
                style={{
                  color: isMine ? (theme?.timestampColor || '#FFFFFF') : (theme?.timestampColor || '#667781'),
                  opacity: isMine ? 0.9 : 0.7,
                  // textShadow: isMine
                  //   ? '0 1px 3px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)'
                  //   : '0 1px 2px rgba(255,255,255,0.9)',
                }}
              >
                {formatTime(message.createdAt)}
              </span>


              {/* Status icon for own messages - WhatsApp style */}
              {isMine && (
                <span className="inline-flex items-center ml-1">
                  {statusConfig.icon}
                </span>
              )}
            </div>
          </div>
      </Dropdown>

      {/* ✅ Forward button - right side for sender's messages - Hidden for platform users */}
      {!isMine && !isPlatformUser && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleForward();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-white shadow-md hover:bg-gray-50 flex items-center justify-center self-end mb-1"
          style={{ border: '1px solid #E9EDEF' }}
          title="Forward message"
        >
          <ShareAltOutlined style={{ fontSize: '14px', color: '#54656F' }} />
        </button>
      )}

      {/* Avatar removed for own messages - WhatsApp style */}

      {/* ✅ Forward Modal */}
      <ForwardMessageModal
        open={isForwardModalOpen}
        onCancel={() => setIsForwardModalOpen(false)}
        message={message}
      />

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
