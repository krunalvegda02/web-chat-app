import { useState, useRef, useEffect } from 'react';
import { Input, Button, Tooltip } from 'antd';
import { SendOutlined, PlusOutlined, SmileOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessageThunk } from '../../redux/slices/chatSlice';
import { useChatSocket } from '../../hooks/useChatSocket';

export default function MessageInput() {
  const dispatch = useDispatch();
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const { activeRoomId } = useSelector((s) => s.chat);
  const { startTyping, stopTyping } = useChatSocket();

  // ✅ Clear typing on unmount
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
    }, 2000); // Reduced timeout
  };

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || !activeRoomId) return;

    clearTypingTimeout();
    stopTyping(activeRoomId);
    
    dispatch(sendMessageThunk(trimmed));
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);

    if (e.target.value.trim()) {
      // Throttle typing indicator
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
      className="px-4 py-3.5 border-t border-gray-100/60 transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 255, 0.8) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className={`flex items-end gap-2.5 px-4 py-2.5 rounded-2xl transition-all duration-200 border ${
          isFocused
            ? 'border-indigo-400/50 shadow-lg shadow-indigo-200/30 bg-white/80'
            : 'border-gray-200/60 bg-white/50'
        }`}
        style={{
          background: isFocused
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 255, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Tooltip title="Attach file" placement="top">
          <Button
            type="text"
            icon={<PlusOutlined className="text-lg" />}
            className="!text-gray-600 hover:!text-indigo-600 hover:!bg-indigo-50/50 !border-0 !h-auto !p-1.5 transition-all"
          />
        </Tooltip>

        <Input.TextArea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            clearTypingTimeout();
            stopTyping(activeRoomId); // ✅ Stop on blur
          }}
          placeholder="Type a message..."
          autoFocus
          autoSize={{ minRows: 1, maxRows: 4 }}
          className="!border-0 !bg-transparent !outline-none !p-0 resize-none placeholder:text-gray-400"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#1f2937',
          }}
        />

        <Tooltip title="Add emoji" placement="top">
          <Button
            type="text"
            icon={<SmileOutlined className="text-lg" />}
            className="!text-gray-600 hover:!text-amber-500 hover:!bg-amber-50/50 !border-0 !h-auto !p-1.5 transition-all"
          />
        </Tooltip>

        <Tooltip title="Send (Enter)" placement="top">
          <Button
            type="primary"
            icon={<SendOutlined className="text-sm" />}
            onClick={handleSend}
            disabled={!value.trim() || !activeRoomId}
            className="!border-0 !h-auto !px-3 !py-1.5 !bg-gradient-to-r !from-indigo-500 !to-purple-600 hover:!from-indigo-600 hover:!to-purple-700 !shadow-md hover:!shadow-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
}
