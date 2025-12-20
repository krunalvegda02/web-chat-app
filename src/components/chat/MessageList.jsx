import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import MessageBubble from './MessageBubble';
import CallLogBubble from './CallLogBubble';
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
    console.log('🔍 MessageList - Raw messages:', messages);
    if (!Array.isArray(messages)) {
      console.log('❌ Messages is not an array');
      return [];
    }

    const filtered = messages
      .filter((message) => {
        if (!message || typeof message !== 'object') {
          console.log('❌ Invalid message object:', message);
          return false;
        }
        if (!message._id) {
          console.log('❌ Message missing _id:', message);
          return false;
        }
        // Log call messages specifically
        if (message.type === 'call') {
          console.log('📞 CALL MESSAGE FOUND:', {
            _id: message._id,
            type: message.type,
            content: message.content,
            callLog: message.callLog,
            senderId: message.senderId,
            sender: message.sender,
            createdAt: message.createdAt
          });
        }
        // Allow messages with content OR media (image/video/file messages may have empty content)
        if (!message.content && (!message.media || !Array.isArray(message.media) || message.media.length === 0)) {
          console.log('❌ Message has no content or media:', message);
          return false;
        }
        if (!message.createdAt) {
          console.log('❌ Message missing createdAt:', message);
          return false;
        }
        if (!message.sender && !message.senderId) {
          console.log('❌ Message missing sender:', message);
          return false;
        }
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

    console.log('✅ MessageList - Valid messages:', filtered.length, filtered);
    return filtered;
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '16px',
          padding: '40px',
          background: '#E5DDD5',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(0, 128, 105, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <InboxOutlined style={{ fontSize: '48px', color: '#8696A0' }} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          <p style={{ fontSize: '14px', color: '#667781', lineHeight: '1.5', margin: 0 }}>
            No messages in this conversation yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 8px',
      }}
    >
      {Object.keys(groupedMessages)
        .sort()
        .map((dateKey) => (
          <div key={dateKey}>
            {/* WhatsApp-style Date Label */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '12px 0',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#667781',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                {formatDateLabel(new Date(dateKey))}
              </div>
            </div>

            {/* Messages for this date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {groupedMessages[dateKey].map((message) => {
                // Check if this is a call log
                if (message.type === 'call' && message.callLog) {
                  return (
                    <CallLogBubble
                      key={message._id}
                      callLog={message.callLog}
                      timestamp={message.createdAt}
                      currentUser={user}
                      senderId={message.senderId}
                    />
                  );
                }
                
                // Regular message
                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    currentUser={user}
                    showAvatar={false}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          </div>
        ))}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicator typingUsers={typingUsers} />
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;