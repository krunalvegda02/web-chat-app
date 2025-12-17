import { useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Divider } from 'antd';
import { format, isToday, isYesterday } from 'date-fns';
import { InboxOutlined } from '@ant-design/icons';
import { chatSocketClient } from '../../sockets/chatSocketClient';

export default function MessageList({ messages = [] }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { typingUsers, activeRoomId, onlineUsers } = useSelector((s) => s.chat);
  const messagesEndRef = useRef(null);
  const markAsReadTimeoutRef = useRef(null);

  // ✅ Validate messages
  const validMessages = Array.isArray(messages)
    ? messages
        .filter((message) => {
          if (!message || typeof message !== 'object') return false;
          if (!message._id || !message.content) return false;
          if (!message.createdAt) return false;
          if (!message.sender && !message.senderId) return false;
          return true;
        })
        .map((message) => ({
          ...message,
          sender: message.sender || {
            _id: message.senderId,
            name: 'Unknown User',
            role: 'USER',
          },
        }))
    : [];

  // ✅ Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [validMessages, scrollToBottom]);

  // Mark as read only when entering room
  useEffect(() => {
    if (activeRoomId && chatSocketClient.isReady()) {
      chatSocketClient.emit('mark_room_read', { roomId: activeRoomId });
    }
  }, [activeRoomId]);

  // Format date
  const formatDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  // Group messages by date
  const groupedMessages = validMessages.reduce((groups, message) => {
    const dateKey = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  if (validMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No messages yet"
        >
          <p className="text-gray-500 text-sm">Start a conversation!</p>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Messages grouped by date */}
      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          {/* Date Divider */}
          <Divider className="my-2">
            <span className="text-xs text-gray-500 font-medium">
              {formatDateLabel(new Date(dateKey))}
            </span>
          </Divider>

          {/* Messages */}
          {dateMessages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              currentUser={user}
              showAvatar={true}
            />
          ))}
        </div>
      ))}

      {/* Typing Indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <TypingIndicator typingUsers={typingUsers} />
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
