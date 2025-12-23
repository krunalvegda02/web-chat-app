import { useEffect, useRef, useCallback, useMemo, memo, useState } from 'react';
import MessageBubble from './MessageBubble';
import CallLogBubble from './CallLogBubble';
import TypingIndicator from './TypingIndicator';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Divider, Spin } from 'antd';
import { format, isToday, isYesterday } from 'date-fns';
import { InboxOutlined } from '@ant-design/icons';
import { deleteMessage, editMessage, fetchMessages } from '../../redux/slices/chatSlice';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useTheme } from '../../hooks/useTheme';


const MessageList = memo(function MessageList({ messages = [] }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { user } = useSelector((s) => s.auth);
  const { typingUsers, activeRoomId, loadingMessages } = useSelector((s) => s.chat);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessagesLength = useRef(0);
  const markedAsReadRef = useRef(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const previousScrollHeight = useRef(0);
  const { deleteMessage: deleteMessageSocket, editMessage: editMessageSocket, markMessagesAsRead } =
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
        // Filter out messages deleted for current user
        if (message.deletedForUsers && Array.isArray(message.deletedForUsers)) {
          if (message.deletedForUsers.includes(user?._id)) {
            console.log('🗑️ Message deleted for current user:', message._id);
            return false;
          }
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
  }, [messages, user?._id]);

  // ✅ Auto-scroll to bottom on new messages (only if user is at bottom or sent the message)
  const scrollToBottom = useCallback((force = false) => {
    if (force) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const container = messagesContainerRef.current?.parentElement;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Scroll to bottom only on initial load
  useEffect(() => {
    if (validMessages.length > 0 && previousMessagesLength.current === 0) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [validMessages.length, scrollToBottom]);

  useEffect(() => {
    // Only auto-scroll for NEW messages (not pagination)
    if (validMessages.length > previousMessagesLength.current && previousMessagesLength.current > 0) {
      const lastMessage = validMessages[validMessages.length - 1];
      const isMyMessage = lastMessage?.senderId === user?._id;
      
      if (isMyMessage) {
        scrollToBottom(true);
      } else {
        scrollToBottom(false);
      }
    }
    
    previousMessagesLength.current = validMessages.length;
  }, [validMessages, scrollToBottom, user?._id]);

  // ✅ Mark messages as read when viewing them (debounced)
  useEffect(() => {
    if (activeRoomId && validMessages.length > 0) {
      const currentUserId = user?._id?.toString();
      
      const unreadMessageIds = validMessages
        .filter((m) => {
          const messageSenderId = m.senderId?.toString();
          const isNotMine = messageSenderId !== currentUserId;
          const isUnread = m.status !== 'read';
          const notMarkedYet = !markedAsReadRef.current.has(m._id);
          
          return isNotMine && isUnread && notMarkedYet;
        })
        .map((m) => m._id);

      if (unreadMessageIds.length > 0) {
        console.log(`📖 [MessageList] Marking ${unreadMessageIds.length} messages as read:`, unreadMessageIds);
        
        // Mark them in our ref to prevent duplicate calls
        unreadMessageIds.forEach(id => markedAsReadRef.current.add(id));
        
        // Debounce the socket call
        const timer = setTimeout(() => {
          markMessagesAsRead(activeRoomId, unreadMessageIds);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [activeRoomId, validMessages, user?._id, markMessagesAsRead]);
  
  // Clear marked messages when room changes
  useEffect(() => {
    markedAsReadRef.current.clear();
    setPage(1);
    setHasMore(true);
  }, [activeRoomId]);

  // Load more messages on scroll to top
  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current?.parentElement;
    if (!container || loadingMore || !hasMore) return;

    // Only load when scrolled to top (within 100px)
    if (container.scrollTop < 100) {
      setLoadingMore(true);
      previousScrollHeight.current = container.scrollHeight;
      
      try {
        const result = await dispatch(fetchMessages({ roomId: activeRoomId, page: page + 1, limit: 20 })).unwrap();
        const newMessages = result?.data?.messages || result?.messages || [];
        
        if (newMessages.length === 0 || newMessages.length < 20) {
          setHasMore(false);
        }
        
        if (newMessages.length > 0) {
          setPage(prev => prev + 1);
          // Maintain scroll position
          setTimeout(() => {
            const container = messagesContainerRef.current?.parentElement;
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - previousScrollHeight.current;
            }
          }, 0);
        }
      } catch (error) {
        console.error('Failed to load more messages:', error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [dispatch, activeRoomId, page, hasMore, loadingMore]);

  useEffect(() => {
    const container = messagesContainerRef.current?.parentElement;
    if (!container) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

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

  // ✅ Show loading state - ONLY for initial load
  if (loadingMessages[activeRoomId] && !validMessages.length) {
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
      ref={messagesContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 8px',
      }}
    >
      {/* Loading more indicator */}
      {loadingMore && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <Spin size="small" />
        </div>
      )}
      
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