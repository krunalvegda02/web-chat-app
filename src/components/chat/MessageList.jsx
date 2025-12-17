import { useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Spin } from 'antd';
import { format, isToday, isYesterday } from 'date-fns';
import { InboxOutlined } from '@ant-design/icons';
import { deleteMessage, editMessage } from '../../redux/slices/chatSlice';
import { useChatSocket } from '../../hooks/useChatSocket';

export default function MessageList({ messages = [] }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { typingUsers, activeRoomId, loadingMessages } = useSelector((s) => s.chat);
  const messagesEndRef = useRef(null);
  const { deleteMessage: deleteMessageSocket, editMessage: editMessageSocket } = useChatSocket();

  // Validate messages before rendering
const validMessages = messages.filter((msg) => {
  if (!msg || typeof msg !== 'object') return false;
  return true;
});



  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [validMessages, scrollToBottom]);

  useEffect(() => {
    if (activeRoomId && validMessages.length > 0) {
      const unreadMessageIds = validMessages
        .filter(m => m.status !== 'read' && m.senderId !== user?._id)
        .map(m => m._id);

      if (unreadMessageIds.length > 0) {
        console.log(`📖 Marking ${unreadMessageIds.length} messages as read`);
      }
    }
  }, [activeRoomId, validMessages, user?._id]);

  const formatDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const groupedMessages = validMessages.reduce((groups, message) => {
    const dateKey = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  if (loadingMessages[activeRoomId]) {
    return <Spin tip="Loading messages..." />;
  }

  if (validMessages.length === 0) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
        description="No messages yet"
        style={{ marginTop: '50px' }}
      />
    );
  }

  const handleEdit = (message) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      dispatch(editMessage({ messageId: message._id, content: newContent }));
      editMessageSocket(message._id, newContent);
    }
  };

  const handleDelete = (messageId) => {
    if (window.confirm('Delete this message?')) {
      dispatch(deleteMessage({ messageId }));
      deleteMessageSocket(messageId);
    }
  };

  return (
    <div style={{ overflowY: 'auto', padding: '16px', height: '100%' }}>
      {Object.keys(groupedMessages)
        .sort()
        .map((dateKey) => (
          <div key={dateKey}>
            <div
              style={{
                textAlign: 'center',
                margin: '16px 0 8px',
                color: '#999',
                fontSize: '12px',
              }}
            >
              {formatDateLabel(new Date(dateKey))}
            </div>

            {groupedMessages[dateKey].map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                currentUser={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ))}

      {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} />}

      <div ref={messagesEndRef} />
    </div>
  );
}
