import { format } from 'date-fns';
import { Avatar, Tooltip, Dropdown, Modal, Input, message as antMessage, Button, Image, Slider } from 'antd';
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
} from '@ant-design/icons';
import { useMemo, useState, useRef, useEffect } from 'react';
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
  const [audioStates, setAudioStates] = useState({});
  const audioRefs = useRef({});

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

  // ✅ Handle deleted messages
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

  // ✅ Context menu items - WhatsApp style
  // Only allow edit for text messages without media
  const canEdit = message.type === 'text' && (!message.media || message.media.length === 0);
  
  const menuItems = isMine ? [
    ...(canEdit ? [{
      key: 'edit',
      label: (
        <div className="flex items-center gap-2">
          <EditOutlined />
          <span>Edit</span>
        </div>
      ),
      onClick: handleEdit,
    }] : []),
    {
      key: 'delete',
      label: (
        <div className="flex items-center gap-2">
          <DeleteOutlined />
          <span>Delete</span>
        </div>
      ),
      onClick: handleDelete,
      danger: true,
    },
  ] : [];

  // WhatsApp-style bubble colors
  const bubbleStyle = {
    borderRadius: bubbleRadius,
    backgroundColor: isMine ? '#DCF8C6' : '#FFFFFF',
    color: '#111827',
    fontSize: '14.2px',
    boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
  };

  const maxWidthClass = message.type === 'image' || message.type === 'video'
    ? 'max-w-[280px]'
    : message.type === 'file'
      ? 'min-w-[250px]'
      : 'max-w-[75%] sm:max-w-[60%]';

  return (
    <div className={`flex mb-3 gap-2 items-end ${isMine ? 'justify-end' : 'justify-start'}`}>
      {/* ✅ Avatar for other users */}
      {!isMine && (
        <Avatar
          size={32}
          src={sender.avatar}
          style={{ backgroundColor: '#10B981' }}
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
            {/* Sender name for other users - WhatsApp style */}
            {!isMine && (
              <div className="text-xs font-semibold mb-1 pt-2 px-3" style={{ color: '#10B981' }}>
                {sender.name}
              </div>
            )}

            {/* ✅ IMAGE MESSAGES - WhatsApp Style */}
            {message.type === 'image' && message.media && message.media.length > 0 && (
              <div className="relative">
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
                  <div className="px-3 pb-2 pt-2" style={{ paddingRight: '70px', minWidth: '100px' }}>
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
                  <div className="px-3 pb-2 pt-2" style={{ paddingRight: '70px', minWidth: '100px' }}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ AUDIO/VOICE MESSAGES - WhatsApp Style */}
            {(message.type === 'audio' || message.type === 'voice') && message.media && message.media.length > 0 && (
              <div className="py-2 px-3">
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
                  <div className="mt-2 pt-2 border-t pb-2" style={{ borderColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', paddingRight: '70px', minWidth: '100px' }}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ FILE MESSAGES */}
            {message.type === 'file' && message.media && message.media.length > 0 && (
              <div className="p-3 pb-4">
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
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', paddingRight: '70px', minWidth: '100px' }}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ TEXT MESSAGES WITH MEDIA (Mixed) - WhatsApp Style */}
            {message.type === 'text' && message.media && message.media.length > 0 && (
              <div className="pt-2 px-3 pb-2">
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
                  <div className="px-0" style={{ paddingRight: '70px', minWidth: '100px' }}>
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* ✅ PURE TEXT MESSAGES */}
            {message.type === 'text' && (!message.media || message.media.length === 0) && message.content && (
              <div className="px-3 py-2 pb-2" style={{ paddingRight: '70px', minWidth: '100px' }}>
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
           

              {/* Status icon for own messages - WhatsApp style */}
              {isMine && (
                <span className="inline-flex items-center ml-1">
                  {statusConfig.icon}
                </span>
              )}
            </div>
          </div>
        </Tooltip>
      </Dropdown>

      {/* Avatar removed for own messages - WhatsApp style */}

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
