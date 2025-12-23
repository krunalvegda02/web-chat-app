import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCallLogs, deleteCallLog } from '../../redux/slices/callLogSlice';
import { useCall } from '../../contexts/CallContext';
import { useTheme } from '../../hooks/useTheme';
import { Avatar, Empty, Spin, Popconfirm, message } from 'antd';
import { PhoneOutlined, DeleteOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { createDirectRoom } from '../../redux/slices/chatSlice';

export default function CallLogs() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { logs, loading } = useSelector((s) => s.callLogs);
  const { user } = useSelector((s) => s.auth);
  const { initiateCall } = useCall();
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    dispatch(fetchCallLogs({ page: 1, limit: 50 }));
  }, [dispatch]);

  const handleCall = async (log) => {
    const otherUser = log.callerId._id === user._id ? log.receiverId : log.callerId;
    
    try {
      const result = await dispatch(createDirectRoom({ userId: otherUser._id })).unwrap();
      const roomId = result?.data?.room?._id || result?.room?._id || result?._id;
      
      if (roomId) {
        initiateCall(otherUser, roomId);
      }
    } catch (error) {
      message.error('Failed to initiate call');
    }
  };

  const handleDelete = async (logId) => {
    setDeletingId(logId);
    try {
      await dispatch(deleteCallLog(logId)).unwrap();
      message.success('Call log deleted');
    } catch (error) {
      message.error('Failed to delete call log');
    } finally {
      setDeletingId(null);
    }
  };

  const getCallIcon = (log) => {
    const isMissed = log.status === 'missed';
    const isIncoming = log.receiverId._id === user._id;
    const color = isMissed ? (theme.errorColor || '#F44336') : (theme.accentColor || '#25D366');
    const rotation = isMissed ? '135deg' : isIncoming ? '225deg' : '45deg';
    
    return (
      <PhoneOutlined 
        style={{ 
          color, 
          fontSize: '16px',
          transform: `rotate(${rotation})`
        }} 
      />
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date) => {
    const now = new Date();
    const callDate = new Date(date);
    const diffDays = Math.floor((now - callDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return callDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return callDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return callDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex flex-col" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ background: theme?.sidebarHeaderColor || '#008069' }}>
        <h1 className="text-xl font-medium" style={{ color: theme.headerTextColor || '#FFFFFF' }}>Calls</h1>
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
        {logs.length > 0 ? (
          logs.map((log) => {
            const otherUser = log.callerId._id === user._id ? log.receiverId : log.callerId;
            const isIncoming = log.receiverId._id === user._id;
            
            return (
              <div
                key={log._id}
                className="flex items-center gap-3 px-6 py-3 border-b transition-colors group"
                style={{ 
                  borderColor: theme.sidebarBorderColor || '#E9EDEF',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/profile/${otherUser._id}`)}
                >
                  <Avatar
                    src={otherUser.avatar}
                    size={50}
                    style={{ backgroundColor: theme.avatarBackgroundColor || '#008069', flexShrink: 0 }}
                  >
                    {otherUser.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </div>

                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/profile/${otherUser._id}`)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[16px] truncate" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                      {otherUser.name}
                    </p>
                    {log.status === 'missed' && (
                      <span className="text-xs" style={{ color: theme.errorColor || '#F44336' }}>(Missed)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.timestampColor || '#667781' }}>
                    {getCallIcon(log)}
                    <span>
                      {isIncoming ? 'Incoming' : 'Outgoing'}
                      {log.duration > 0 && ` • ${formatDuration(log.duration)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>
                    {formatTime(log.createdAt)}
                  </span>
                  
                  <button
                    onClick={() => handleCall(log)}
                    className="p-2 rounded-full transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#E9EDEF'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <PhoneOutlined style={{ color: theme.sendButtonColor || '#008069', fontSize: '20px' }} />
                  </button>

                  <Popconfirm
                    title="Delete call log?"
                    onConfirm={() => handleDelete(log._id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <button
                      disabled={deletingId === log._id}
                      className="p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#E9EDEF'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <DeleteOutlined style={{ color: theme.timestampColor || '#667781', fontSize: '18px' }} />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <Empty
              image={<PhoneOutlined style={{ fontSize: '64px', color: theme.timestampColor || '#8696A0' }} />}
              description={
                <span style={{ color: theme.timestampColor || '#667781' }} className="text-sm">
                  No call history yet
                </span>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
