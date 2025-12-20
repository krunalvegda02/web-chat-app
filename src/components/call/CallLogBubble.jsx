import { PhoneOutlined } from '@ant-design/icons';

export default function CallLogBubble({ message }) {
  const { callLog } = message;
  
  if (!callLog) return null;

  const getCallIcon = () => {
    const iconStyle = { fontSize: '16px', marginRight: '8px' };
    
    if (callLog.status === 'missed') {
      return <PhoneOutlined style={{ ...iconStyle, color: '#E53935', transform: 'rotate(135deg)' }} />;
    }
    
    // Incoming call
    if (callLog.receiverId === message.sender?._id || callLog.receiverId === message.senderId) {
      return <PhoneOutlined style={{ ...iconStyle, color: '#00A884', transform: 'rotate(225deg)' }} />;
    }
    
    // Outgoing call
    return <PhoneOutlined style={{ ...iconStyle, color: '#00A884', transform: 'rotate(45deg)' }} />;
  };

  const getCallText = () => {
    const isMissed = callLog.status === 'missed';
    const isIncoming = callLog.receiverId === message.sender?._id || callLog.receiverId === message.senderId;
    
    let text = isIncoming ? 'Incoming call' : 'Outgoing call';
    if (isMissed) text = 'Missed call';
    
    if (callLog.duration) {
      const minutes = Math.floor(callLog.duration / 60);
      const seconds = callLog.duration % 60;
      text += ` (${minutes}:${seconds.toString().padStart(2, '0')})`;
    }
    
    return text;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      fontSize: '14px',
      color: '#667781',
    }}>
      {getCallIcon()}
      <span>{getCallText()}</span>
    </div>
  );
}
