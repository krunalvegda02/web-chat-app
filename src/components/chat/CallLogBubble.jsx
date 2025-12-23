import { PhoneOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';

export default function CallLogBubble({ callLog, timestamp, currentUser, senderId }) {
  const { theme } = useTheme();
  
  // Use senderId from message for positioning (who sent the message)
  const messageSenderId = typeof senderId === 'object' ? senderId?._id : senderId;
  const currentUserIdStr = currentUser?._id;
  
  // Message sender determines bubble position
  const isMine = messageSenderId?.toString() === currentUserIdStr?.toString();
  
  // Extract call participants
  const callerIdStr = typeof callLog.callerId === 'object' ? callLog.callerId?._id : callLog.callerId;
  const receiverIdStr = typeof callLog.receiverId === 'object' ? callLog.receiverId?._id : callLog.receiverId;
  
  // Determine if current user was caller or receiver
  const iWasCaller = callerIdStr?.toString() === currentUserIdStr?.toString();
  const iWasReceiver = receiverIdStr?.toString() === currentUserIdStr?.toString();
  
  const getCallIcon = () => {
    if (callLog.status === 'missed') {
      return <PhoneOutlined style={{ color: '#FF3B30', fontSize: '16px', transform: 'rotate(135deg)' }} />;
    }
    if (callLog.status === 'rejected') {
      return <PhoneOutlined style={{ color: '#FF3B30', fontSize: '16px', transform: 'rotate(135deg)' }} />;
    }
    if (iWasReceiver) {
      return <PhoneOutlined style={{ color: '#00A884', fontSize: '16px', transform: 'rotate(225deg)' }} />;
    }
    return <PhoneOutlined style={{ color: '#00A884', fontSize: '16px', transform: 'rotate(45deg)' }} />;
  };

  const getCallText = () => {
    if (callLog.status === 'missed') {
      return iWasReceiver ? 'Missed call' : 'Call not answered';
    }
    if (callLog.status === 'rejected') {
      return iWasReceiver ? 'Declined' : 'Call declined';
    }
    if (callLog.status === 'ended' && callLog.duration > 0) {
      const mins = Math.floor(callLog.duration / 60);
      const secs = callLog.duration % 60;
      return `${iWasReceiver ? 'Incoming' : 'Outgoing'} call (${mins}:${secs.toString().padStart(2, '0')})`;
    }
    return iWasReceiver ? 'Incoming call' : 'Outgoing call';
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        style={{
          backgroundColor: isMine ? (theme.chatBubbleUser || '#DCF8C6') : (theme.chatBubbleAdmin || '#FFFFFF'),
          color: isMine ? (theme.chatBubbleUserText || '#111B21') : (theme.chatBubbleAdminText || '#111B21'),
          borderRadius: `${theme.messageBorderRadius || 8}px`,
          padding: '8px 12px',
          maxWidth: '280px',
          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
          fontSize: `${theme.messageFontSize || 14}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getCallIcon()}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: `${theme.messageFontSize || 14}px` }}>
              {getCallText()}
            </div>
            <div style={{ fontSize: '11px', color: '#667781', marginTop: '2px' }}>
              {timestamp && formatTime(timestamp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
