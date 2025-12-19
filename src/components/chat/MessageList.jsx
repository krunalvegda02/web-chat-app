import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Divider, Spin } from 'antd';
import { format, isToday, isYesterday } from 'date-fns';
import { InboxOutlined } from '@ant-design/icons';
import { deleteMessage, editMessage } from '../../redux/slices/chatSlice';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useTheme } from '../../hooks/useTheme';


const MessageList = memo(function MessageList({ messages = [] }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { user } = useSelector((s) => s.auth);
  const { typingUsers, activeRoomId, loadingMessages } = useSelector((s) => s.chat);
  const messagesEndRef = useRef(null);
  const { deleteMessage: deleteMessageSocket, editMessage: editMessageSocket } =
    useChatSocket();

  // ✅ Validate and memoize messages for performance
  const validMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];

    return messages
      .filter((message) => {
        if (!message || typeof message !== 'object') return false;
        if (!message._id) return false;
        // Allow messages with content OR media (image/video/file messages may have empty content)
        if (!message.content && (!message.media || !Array.isArray(message.media) || message.media.length === 0)) return false;
        if (!message.createdAt) return false;
        if (!message.sender && !message.senderId) return false;
        return true;
      })
      .map((message) => {
        // Normalize senderId - handle both object and string formats
        const senderId = typeof message.senderId === 'object' && message.senderId?._id 
          ? message.senderId._id 
          : (message.senderId || message.sender?._id);
        
        // Normalize sender - use senderId object if it's populated, otherwise use sender
        const sender = message.sender || (typeof message.senderId === 'object' ? message.senderId : null) || {
          _id: senderId,
          name: 'Unknown User',
        };

        return {
          ...message,
          sender,
          senderId,
          // Ensure media array exists and is properly formatted
          media: Array.isArray(message.media) ? message.media : [],
        };
      });
  }, [messages]);

  // ✅ Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [validMessages, scrollToBottom]);

  // ✅ Mark messages as read
  useEffect(() => {
    if (activeRoomId && validMessages.length > 0) {
      const unreadMessageIds = validMessages
        .filter((m) => m.status !== 'read' && m.senderId !== user?._id)
        .map((m) => m._id);

      if (unreadMessageIds.length > 0) {
        console.log(`📖 Marking ${unreadMessageIds.length} messages as read`);
      }
    }
  }, [activeRoomId, validMessages, user?._id]);

  // ✅ Format date label - WhatsApp style
  const formatDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    // Format like "Dec 19, 2024" or "19/12/2024" - WhatsApp style
    return format(date, 'MMM d, yyyy');
  };

  // ✅ Group messages by date
  const groupedMessages = useMemo(() => {
    return validMessages.reduce((groups, message) => {
      const dateKey = format(new Date(message.createdAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
      return groups;
    }, {});
  }, [validMessages]);

  // ✅ Handle message edit
  const handleEdit = (message) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      dispatch(editMessage({ messageId: message._id, content: newContent }));
      editMessageSocket(message._id, newContent);
    }
  };

  // ✅ Handle message delete
  const handleDelete = (messageId) => {
    if (window.confirm('Delete this message?')) {
      dispatch(deleteMessage({ messageId }));
      deleteMessageSocket(messageId);
    }
  };

  // ✅ Show loading state
  if (loadingMessages[activeRoomId]) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: theme.backgroundColor,
        }}
      >
        <Spin tip="Loading messages..." />
      </div>
    );
  }

  // ✅ Show empty state with theme colors
  if (validMessages.length === 0) {
    return (
      <Empty
        image={
          <InboxOutlined
            style={{
              fontSize: '48px',
              color: theme.borderColor,
            }}
          />
        }
        description="Start a conversation!"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          backgroundColor: theme.backgroundColor,
          color: theme.borderColor,
        }}
      />
    );
  }

  return (
    <div
      style={{
        overflowY: 'auto',
        padding: '16px',
        height: '100%',
        backgroundColor: theme.backgroundColor,
      }}
    >
      {Object.keys(groupedMessages)
        .sort()
        .map((dateKey) => (
          <div key={dateKey}>
            {/* ✅ Date divider - WhatsApp style (subtle and centered) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '16px 0',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: theme.borderColor,
                  opacity: 0.3,
                }}
              />
              <span
                style={{
                  fontSize: '12.5px',
                  color: theme.headerText,
                  backgroundColor: theme.backgroundColor,
                  padding: '0 12px',
                  position: 'relative',
                  fontWeight: 400,
                  opacity: 0.8,
                  letterSpacing: '0.3px',
                }}
              >
                {formatDateLabel(new Date(dateKey))}
              </span>
            </div>

            {/* ✅ Messages for this date */}
            {groupedMessages[dateKey].map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                currentUser={user}
                showAvatar={theme.showAvatars}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ))}

      {/* ✅ Typing indicator with theme control */}
      {theme.enableTypingIndicator && typingUsers.length > 0 && (
        <TypingIndicator typingUsers={typingUsers} />
      )}

      {/* ✅ Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;