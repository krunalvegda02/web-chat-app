import { useState, useEffect } from 'react';
import { Avatar, Input } from 'antd';
import { SendOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setActiveRoom } from '../../redux/slices/chatSlice';

export default function WhatsAppNotification({ notification, onClose, onReply }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showReply) onClose();
    }, 30000); // 30 seconds for testing
    return () => clearTimeout(timer);
  }, [showReply, onClose]);

  const handleOpen = () => {
    dispatch(setActiveRoom(notification.roomId));
    
    // Determine correct route based on user role
    let chatPath = '/user/chats'; // Default for regular users
    
    if (notification.userRole === 'SUPER_ADMIN') {
      chatPath = '/super-admin/chats';
    } else if (['TENANT_ADMIN', 'PLATFORM_ADMIN'].includes(notification.userRole)) {
      chatPath = '/admin';
    } else if (notification.userRole === 'USER') {
      // Check if platform user
      if (notification.externalUserId || notification.platformId) {
        chatPath = '/user/chats';
      } else {
        chatPath = '/contacts'; // Regular users go to contacts first, then chat opens
      }
    }
    
    console.log('🔔 [Notification] Navigating to:', chatPath, 'for role:', notification.userRole);
    
    // Navigate to the appropriate chat route
    if (notification.roomId) {
      if (chatPath === '/contacts') {
        // For regular users, navigate to contacts and set active room
        navigate(chatPath);
      } else {
        // For admin users, navigate directly to chat with room parameter
        navigate(`${chatPath}?room=${notification.roomId}`);
      }
    } else {
      navigate(chatPath);
    }
    
    onClose();
  };

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(notification.roomId, replyText);
      setReplyText('');
      onClose();
    }
  };

  return (
    <div
      className="animate-slideIn"
      style={{
        width: '360px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
        onClick={handleOpen}
      >
        <Avatar
          size={48}
          src={notification.avatar}
          style={{ backgroundColor: '#25D366', flexShrink: 0 }}
        >
          {notification.senderName?.charAt(0)?.toUpperCase()}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 truncate">
              {notification.senderName}
            </p>
            <CloseOutlined
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            />
          </div>
          <p className="text-sm text-gray-600 truncate mt-1">
            {notification.body}
          </p>
        </div>
      </div>

      {/* Reply Section */}
      {showReply ? (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onPressEnter={handleReply}
              autoFocus
              style={{ borderRadius: '20px' }}
            />
            <button
              onClick={handleReply}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366] text-white hover:bg-[#20BA5A]"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
              <SendOutlined />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex border-t border-gray-200" style={{ display: 'flex', width: '100%' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReply(true);
            }}
            className="flex-1 py-3 text-[#25D366] font-medium hover:bg-gray-50 transition-colors"
            style={{ flex: 1, border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            Reply
          </button>
          <div style={{ width: '1px', background: '#e5e7eb' }}></div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
            className="flex-1 py-3 text-[#25D366] font-medium hover:bg-gray-50 transition-colors"
            style={{ flex: 1, border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            Open
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
