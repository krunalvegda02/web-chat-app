import { useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Select, Card } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Option } = Select;

export default function AdminUsersChat() {
  const { user } = useAuthGuard(['ADMIN']);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatParticipants, setChatParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Static users data for now
  const users = [
    { _id: '1', name: 'John Doe', email: 'john@example.com' },
    { _id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { _id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  const handleUserSelect = async (userId) => {
    setSelectedUserId(userId);
    const selectedUser = users.find(u => u._id === userId);
    setSelectedUser(selectedUser);
    setSelectedParticipant(null);
    
    // Static chat participants for now
    setChatParticipants([
      { participantId: '1', participantName: 'Support Team', lastMessage: 'How can we help?' },
      { participantId: '2', participantName: 'Sales Team', lastMessage: 'Thanks for your interest' },
    ]);
  };

  const handleParticipantSelect = (participant) => {
    setSelectedParticipant(participant);
  };

  if (!user) return null;

  return (
    <div className="h-screen p-4">
      {/* User Selector */}
      <Card className="mb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <UserOutlined className="text-xl text-blue-600" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Select User to View Chats</h3>
            <Select
              placeholder="Choose a user to view their chats"
              style={{ width: '100%', maxWidth: 400 }}
              size="large"
              value={selectedUserId}
              onChange={handleUserSelect}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option key={user._id} value={user._id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-gray-500">({user.email})</span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          {selectedUser && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Viewing chats for:</p>
              <p className="font-semibold">{selectedUser.name}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Chat Interface */}
      {selectedUserId ? (
        <div className="grid grid-cols-12 gap-4 h-[calc(100%-140px)]">
          <div className="col-span-4">
            <div
              className="h-full flex flex-col rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 255, 0.9) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="p-4 border-b border-gray-200/50">
                <h2 className="text-lg font-bold text-gray-800">{selectedUser?.name}'s Conversations</h2>
                <p className="text-xs text-gray-500 mt-1">{chatParticipants.length} conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading conversations...</div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {chatParticipants.map((participant) => (
                      <div
                        key={participant.participantId}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                          selectedParticipant?.participantId === participant.participantId 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50 border-transparent'
                        }`}
                        onClick={() => handleParticipantSelect(participant)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                            {participant.participantName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{participant.participantName}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {participant.lastMessage}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-span-8">
            <div
              className="h-full flex flex-col rounded-2xl overflow-hidden border border-gray-200/60 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 255, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                className="px-6 py-4 border-b border-gray-100/60 flex items-center gap-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 255, 0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">
                    {selectedParticipant ? `${selectedUser?.name} & ${selectedParticipant.participantName}` : 'Select a conversation'}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Read-only mode
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <UserOutlined className="text-4xl mb-4" />
                  <p>Select a chat to view messages</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card className="h-[calc(100%-140px)] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <UserOutlined className="text-6xl mb-4" />
            <h3 className="text-xl mb-2">No User Selected</h3>
            <p>Please select a user from the dropdown above to view their chats</p>
          </div>
        </Card>
      )}
    </div>
  );
}
