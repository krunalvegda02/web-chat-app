import { useEffect } from 'react';
import { chatSocketClient } from '../sockets/chatSocketClient.js';

export const useSocketEvents = (events = {}, dependencies = []) => {
  useEffect(() => {
    if (!chatSocketClient.isReady()) {
      console.warn('⚠️  Socket not ready for event listeners');
      return;
    }

    const registeredEvents = Object.entries(events).map(([eventName, callback]) => {
      if (callback) {
        chatSocketClient.on(eventName, callback);
      }
      return { eventName, callback };
    });

    return () => {
      registeredEvents.forEach(({ eventName, callback }) => {
        if (callback) {
          chatSocketClient.off(eventName, callback);
        }
      });
    };
  }, [events, ...dependencies]);
};

export default useSocketEvents;




















///.     how to use in chat compoents




// import { useChatSocket } from '../../../sockets/hooks/useChatSocket.js';
// import { useState, useCallback, useEffect } from 'react';

// const ChatPage = ({ roomId }) => {
//   const [messages, setMessages] = useState([]);

//   const {
//     isConnected,
//     isLoading,
//     error,
//     joinRoom,
//     sendMessage,
//     editMessage,
//     deleteMessage,
//     addReaction,
//   } = useChatSocket({
//     onMessageReceived: useCallback((msg) => {
//       setMessages(prev => [...prev, msg]);
//     }, []),

//     onMessageEdited: useCallback(({ messageId, content }) => {
//       setMessages(prev =>
//         prev.map(m =>
//           m._id === messageId ? { ...m, content, isEdited: true } : m
//         )
//       );
//     }, []),

//     onMessageDeleted: useCallback(({ messageId }) => {
//       setMessages(prev =>
//         prev.map(m =>
//           m._id === messageId ? { ...m, deletedAt: new Date() } : m
//         )
//       );
//     }, []),

//     onReactionAdded: useCallback(({ messageId, emoji, userId }) => {
//       setMessages(prev =>
//         prev.map(m =>
//           m._id === messageId
//             ? { ...m, reactions: [...m.reactions, { emoji, userId }] }
//             : m
//         )
//       );
//     }, []),
//   });

//   useEffect(() => {
//     if (isConnected && roomId) {
//       joinRoom(roomId);
//     }
//   }, [isConnected, roomId, joinRoom]);

//   if (isLoading) return <div>Connecting...</div>;
//   if (error) return <div>Error: {error.message}</div>;

//   return (
//     <div>
//       <div className="messages">
//         {messages.map(msg => (
//           <div key={msg._id}>
//             <strong>{msg.sender.name}</strong>
//             <p>{msg.content}</p>
//             <button onClick={() => deleteMessage(msg._id)}>Delete</button>
//             <button onClick={() => addReaction(msg._id, '😊')}>React</button>
//           </div>
//         ))}
//       </div>
      
//       <input
//         onKeyPress={(e) => {
//           if (e.key === 'Enter') {
//             sendMessage(roomId, e.target.value);
//             e.target.value = '';
//           }
//         }}
//         placeholder="Type message..."
//       />
//     </div>
//   );
// };

// export default ChatPage;
