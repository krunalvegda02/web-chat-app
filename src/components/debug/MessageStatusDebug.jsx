import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, Badge, Typography } from 'antd';

const { Text } = Typography;

/**
 * Debug component to monitor real-time message status changes
 * Only shows in development mode
 */
export default function MessageStatusDebug() {
  const { activeRoomId, messagesByRoom } = useSelector((s) => s.chat);
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(0);

  const messages = messagesByRoom[activeRoomId] || [];

  // Monitor message status changes
  useEffect(() => {
    const currentTime = Date.now();
    const recentMessages = messages.filter(msg => 
      msg._updatedAt && (currentTime - msg._updatedAt) < 5000 // Last 5 seconds
    );

    if (recentMessages.length > 0) {
      setLastUpdate(currentTime);
      setStatusUpdates(prev => [
        ...prev.slice(-10), // Keep last 10 updates
        {
          timestamp: currentTime,
          roomId: activeRoomId,
          updates: recentMessages.map(msg => ({
            id: msg._id,
            status: msg.status,
            updatedAt: msg._updatedAt
          }))
        }
      ]);
    }
  }, [messages, activeRoomId]);

  // Listen for custom events
  useEffect(() => {
    const handleStatusUpdate = (event) => {
      console.log('🔔 [DEBUG] Status update event:', event.detail);
      setStatusUpdates(prev => [
        ...prev.slice(-10),
        {
          timestamp: Date.now(),
          type: 'status_update',
          data: event.detail
        }
      ]);
    };

    const handleReadUpdate = (event) => {
      console.log('🔔 [DEBUG] Read update event:', event.detail);
      setStatusUpdates(prev => [
        ...prev.slice(-10),
        {
          timestamp: Date.now(),
          type: 'read_update',
          data: event.detail
        }
      ]);
    };

    window.addEventListener('message_status_updated', handleStatusUpdate);
    window.addEventListener('messages_read_updated', handleReadUpdate);

    return () => {
      window.removeEventListener('message_status_updated', handleStatusUpdate);
      window.removeEventListener('messages_read_updated', handleReadUpdate);
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const statusCounts = messages.reduce((acc, msg) => {
    acc[msg.status || 'unknown'] = (acc[msg.status || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card 
      size="small" 
      title="Message Status Debug" 
      style={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        width: 300, 
        zIndex: 9999,
        fontSize: '12px'
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <Text strong>Room: </Text>
        <Text code>{activeRoomId?.slice(-8) || 'None'}</Text>
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <Text strong>Status Counts: </Text>
        {Object.entries(statusCounts).map(([status, count]) => (
          <Badge 
            key={status} 
            count={count} 
            style={{ 
              backgroundColor: status === 'read' ? '#52c41a' : 
                              status === 'delivered' ? '#1890ff' : 
                              status === 'sent' ? '#faad14' : '#f5222d',
              marginRight: 4
            }}
            title={status}
          />
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text strong>Last Update: </Text>
        <Text>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'None'}</Text>
      </div>

      <div>
        <Text strong>Recent Updates:</Text>
        <div style={{ maxHeight: 100, overflowY: 'auto', fontSize: '10px' }}>
          {statusUpdates.slice(-5).map((update, i) => (
            <div key={i} style={{ marginBottom: 2 }}>
              <Text code>{new Date(update.timestamp).toLocaleTimeString()}</Text>
              {update.type && <Text> - {update.type}</Text>}
              {update.updates && <Text> - {update.updates.length} msgs</Text>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}