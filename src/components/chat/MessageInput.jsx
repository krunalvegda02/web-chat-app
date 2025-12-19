import { useState, useRef, useEffect, memo } from 'react';
import { Input, Button, Space, Tooltip, message as antMessage, Upload, Image } from 'antd';
import { SendOutlined, PaperClipOutlined, CloseCircleOutlined, PlayCircleOutlined, FileOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage, uploadChatMedia, sendMessageAPI } from '../../redux/slices/chatSlice';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useTheme } from '../../hooks/useTheme';
import { v4 as uuidv4 } from 'uuid';


const MessageInput = memo(function MessageInput() {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [fileList, setFileList] = useState([]);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const { activeRoomId } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const { sendMessage: sendSocketMessage, startTyping, stopTyping } = useChatSocket();

  const sendMessage = async (roomId, content, type = 'text', media = []) => {
    if (media.length > 0) {
      return dispatch(sendMessageAPI({ roomId, content, type, media })).unwrap();
    }
    return sendSocketMessage(roomId, content);
  };

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Don't call stopTyping here - it causes infinite loop
    };
  }, []); // ✅ Empty deps - only run on mount/unmount

  // ✅ Clear typing timeout
  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // ✅ Send typing indicator
  const sendTypingIndicator = () => {
    if (!activeRoomId || !value.trim()) return;

    startTyping(activeRoomId);
    clearTypingTimeout();

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(activeRoomId);
    }, 2000);
  };

  const handleSend = async () => {
    const trimmed = value.trim();
    if ((!trimmed && fileList.length === 0) || !activeRoomId || isSending) return;

    setIsSending(true);
    clearTypingTimeout();
    stopTyping(activeRoomId);

    try {
      let mediaUrls = [];

      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach(file => {
          const fileObj = file.originFileObj || file;
          console.log('📎 Appending file:', fileObj.name, fileObj.type, fileObj.size);
          formData.append('files', fileObj);
        });
        console.log('📦 FormData entries:', Array.from(formData.entries()).length);
        const uploadResult = await dispatch(uploadChatMedia(formData)).unwrap();
        mediaUrls = uploadResult.data.media;
      }

      const messageType = mediaUrls.length > 0 
        ? (mediaUrls[0].type === 'video' ? 'video' : mediaUrls[0].type === 'image' ? 'image' : 'file')
        : 'text';

      const optimisticMessage = {
        _id: `temp_${uuidv4()}`,
        roomId: activeRoomId,
        content: trimmed,
        type: messageType,
        media: mediaUrls,
        senderId: user._id,
        sender: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        status: 'sending',
        optimistic: true,
        createdAt: new Date().toISOString(),
      };

      dispatch(addMessage({ roomId: activeRoomId, message: optimisticMessage }));

      await sendMessage(activeRoomId, trimmed, messageType, mediaUrls);

      setValue('');
      setFileList([]);
      inputRef.current?.focus();
      antMessage.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      antMessage.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // ✅ Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Handle text change with typing indicator
  const handleChange = (e) => {
    setValue(e.target.value);
    if (e.target.value.trim()) {
      if (!typingTimeoutRef.current) {
        sendTypingIndicator();
      }
    } else {
      clearTypingTimeout();
      stopTyping(activeRoomId);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      if (fileList.length >= 5) {
        antMessage.error('Maximum 5 files allowed');
        return false;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = {
          uid: file.uid,
          name: file.name,
          type: file.type,
          size: file.size,
          originFileObj: file,
          preview: e.target.result,
        };
        setFileList([...fileList, newFile]);
      };
      reader.readAsDataURL(file);
      return false;
    },
    showUploadList: false,
  };

  const removeFile = (uid) => {
    setFileList(fileList.filter(f => f.uid !== uid));
  };

  const renderFilePreview = (file) => {
    const isImage = file.type?.startsWith('image/');
    const isVideo = file.type?.startsWith('video/');

    return (
      <div
        key={file.uid}
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `2px solid ${theme.borderColor}`,
          backgroundColor: theme.secondaryColor,
        }}
      >
        {isImage && (
          <img
            src={file.preview}
            alt={file.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {isVideo && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video
              src={file.preview}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <PlayCircleOutlined
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '32px',
                color: 'white',
                opacity: 0.8,
              }}
            />
          </div>
        )}
        {!isImage && !isVideo && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '8px',
            }}
          >
            <FileOutlined style={{ fontSize: '32px', color: theme.primaryColor }} />
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: theme.headerText,
                textAlign: 'center',
                wordBreak: 'break-word',
              }}
            >
              {file.name}
            </div>
          </div>
        )}
        <CloseCircleOutlined
          onClick={() => removeFile(file.uid)}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '20px',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 10,
          }}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '16px',
        borderTop: `1px solid ${theme.borderColor}`,
        backgroundColor: theme.backgroundColor,
      }}
    >
      {fileList.length > 0 && (
        <div style={{ 
          marginBottom: '12px',
          padding: '12px',
          backgroundColor: theme.secondaryColor,
          borderRadius: '12px',
          border: `1px solid ${theme.borderColor}`,
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            {fileList.map(renderFilePreview)}
          </div>
        </div>
      )}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center',
        padding: '8px',
        backgroundColor: theme.secondaryColor,
        borderRadius: '12px',
        border: `1px solid ${theme.borderColor}`,
      }}>
        <Upload {...uploadProps} maxCount={5}>
          <Tooltip title="Attach files (images, videos, documents)">
            <Button
              type="text"
              icon={<PaperClipOutlined style={{ fontSize: '18px' }} />}
              disabled={!activeRoomId || isSending}
              style={{
                color: theme.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
        </Upload>

        <Input.TextArea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Type a message..."
          disabled={!activeRoomId || isSending}
          maxLength={5000}
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: theme.headerText,
            fontSize: `${theme.messageFontSize}px`,
            resize: 'none',
            padding: '4px 8px',
          }}
          bordered={false}
        />

        <Tooltip title={isSending ? 'Sending...' : 'Send (Enter)'}>
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined style={{ fontSize: '16px' }} />}
            onClick={handleSend}
            disabled={(!value.trim() && fileList.length === 0) || !activeRoomId || isSending}
            loading={isSending}
            size="large"
            style={{
              backgroundColor: (!value.trim() && fileList.length === 0) ? theme.borderColor : theme.primaryColor,
              borderColor: (!value.trim() && fileList.length === 0) ? theme.borderColor : theme.primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
});

export default MessageInput;