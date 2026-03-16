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


const MessageList = memo(function MessageList({ messages = [], searchQuery = '', searchResults = [], currentSearchIndex = 0 }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { user } = useSelector((s) => s.auth);
  const { typingUsers, activeRoomId, loadingMessages } = useSelector((s) => s.chat);
  const messagesContainerRef = useRef(null);
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

  // Load more messages on scroll to bottom (which is top in reverse layout)
  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current?.parentElement;
    if (!container || loadingMore || !hasMore) return;

    // In reverse layout, scroll to "bottom" means scrollTop is at maximum
    const isAtBottom = container.scrollTop >= (container.scrollHeight - container.clientHeight - 100);
    
    if (isAtBottom) {
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
          // Maintain scroll position for reverse layout
          setTimeout(() => {
            const container = messagesContainerRef.current?.parentElement;
            if (container) {
              const newScrollHeight = container.scrollHeight;
              // In reverse layout, maintain position from bottom
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
        flexDirection: 'column-reverse', // Reverse to work with parent's column-reverse
        gap: '8px',
        padding: '12px 8px',
      }}
    >
      {/* Messages in reverse order (newest first for reverse layout) */}
      {Object.keys(groupedMessages)
        .sort((a, b) => new Date(b) - new Date(a)) // Sort dates in descending order
        .map((dateKey) => (
          <div key={dateKey}>
            {/* Messages for this date in reverse order */}
            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px' }}>
              {groupedMessages[dateKey]
                .slice() // Create a copy to avoid mutating original
                .reverse() // Reverse messages within the day
                .map((message, msgIdx) => {
                // Check if this message is a search result
                const isSearchResult = searchResults.some(r => r.msg._id === message._id);
                const isCurrentSearchResult = searchResults[currentSearchIndex]?.msg._id === message._id;

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

                // Regular message with search highlight
                return (
                  <div
                    key={message._id}
                    id={`msg-${message._id}`}
                    style={{
                      backgroundColor: isCurrentSearchResult
                        ? 'rgba(255, 235, 59, 0.5)'
                        : isSearchResult
                          ? 'rgba(255, 235, 59, 0.2)'
                          : 'transparent',
                      borderRadius: '8px',
                      padding: isSearchResult ? '4px' : '0',
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    <MessageBubble
                      message={message}
                      currentUser={user}
                      showAvatar={false}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      searchQuery={searchQuery}
                    />
                  </div>
                );
              })}
            </div>

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
                {formatDateLabel(new Date(dateKey + 'T00:00:00'))}
              </div>
            </div>
          </div>
        ))}

      {/* Loading more indicator at bottom (top in reverse layout) */}
      {loadingMore && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <Spin size="small" />
        </div>
      )}
    </div>
  );
});

export default MessageList;