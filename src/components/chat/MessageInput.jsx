import { useState, useRef, useEffect } from 'react';
import { Input, Button, Space, message as antMessage } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage } from '../../redux/slices/chatSlice';
import { useChatSocket } from '../../hooks/useChatSocket';
import { v4 as uuidv4 } from 'uuid';

export default function MessageInput() {
  const dispatch = useDispatch();
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const { activeRoomId } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const { sendMessage, startTyping, stopTyping } = useChatSocket();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (activeRoomId) {
        stopTyping(activeRoomId);
      }
    };
  }, [activeRoomId, stopTyping]);

  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

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
    if (!trimmed || !activeRoomId || isSending) return;

    setIsSending(true);
    clearTypingTimeout();
    stopTyping(activeRoomId);

    try {
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

      dispatch(addMessage({
        roomId: activeRoomId,
        message: optimisticMessage,
      }));

      await sendMessage(activeRoomId, trimmed);

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

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
    <Space.Compact style={{ width: '100%' }}>
      <Input.TextArea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
        rows={3}
        disabled={!activeRoomId || isSending}
        maxLength={5000}
        style={{ resize: 'none' }}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        disabled={!value.trim() || !activeRoomId || isSending}
        loading={isSending}
        style={{ height: '100%' }}
      >
        Send
      </Button>
    </Space.Compact>
  );
}
