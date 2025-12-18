import { useState, useRef, useEffect, memo } from 'react';
import { Input, Button, Space, Tooltip, message as antMessage } from 'antd';
import { SendOutlined, PlusOutlined, SmileOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage } from '../../redux/slices/chatSlice';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useTheme } from '../../hooks/useTheme';
import { v4 as uuidv4 } from 'uuid';


const MessageInput = memo(function MessageInput() {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const { activeRoomId } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const { sendMessage, startTyping, stopTyping } = useChatSocket();

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

  // ✅ Handle send message with optimistic updates
  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || !activeRoomId || isSending) return;

    setIsSending(true);
    clearTypingTimeout();
    stopTyping(activeRoomId);

    try {
      // ✅ Optimistic message - shows immediately
      const optimisticMessage = {
        _id: `temp_${uuidv4()}`,
        roomId: activeRoomId,
        content: trimmed,
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

      // ✅ Add to UI immediately for instant feedback
      dispatch(
        addMessage({
          roomId: activeRoomId,
          message: optimisticMessage,
        })
      );

      // ✅ Send to server
      await sendMessage(activeRoomId, trimmed);

      // ✅ Clear input
      setValue('');
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

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: `1px solid ${theme.borderColor}`,
        backgroundColor: theme.backgroundColor,
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
      }}
    >
      <Space style={{ flex: 1 }}>
        <Input.TextArea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Type a message... "
          // rows={3}
          disabled={!activeRoomId || isSending}
          maxLength={5000}
          style={{
            backgroundColor: theme.secondaryColor,
            borderColor: theme.borderColor,
            color: theme.headerText,
            fontSize: `${theme.messageFontSize}px`,
            resize: 'none',
          }}
          bordered
        />
      </Space>

      <Tooltip title={isSending ? 'Sending...' : 'Send message (Enter)'}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!value.trim() || !activeRoomId || isSending}
          loading={isSending}
          style={{
            backgroundColor: theme.primaryColor,
            borderColor: theme.primaryColor,
            height: '100%',
          }}
        >
          Send
        </Button>
      </Tooltip>
    </div>
  );
});

export default MessageInput;