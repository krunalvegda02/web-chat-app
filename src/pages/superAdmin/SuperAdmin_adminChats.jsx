import { useEffect, useState } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useDispatch, useSelector } from 'react-redux';
import { getAllTenants } from '../../redux/slices/tenantSlice';
import { setActiveRoom, fetchMessages } from '../../redux/slices/chatSlice';
import MessageList from '../../components/chat/MessageList';
import { Select, Card } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get } from '../../helper/apiClient';

const { Option } = Select;

// Create thunk for fetching admin chats
const fetchAdminChats = createAsyncThunkHandler(
  'chat/fetchAdminChats',
  _get,
  (adminId) => `/chat/admin/${adminId}/chats`
);

export default function SuperAdminAdminChats() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  const dispatch = useDispatch();
  const { tenants } = useSelector((state) => state.tenant);
  const { activeRoomId, messagesByRoom } = useSelector((s) => s.chat);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [chatParticipants, setChatParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    dispatch(getAllTenants());
  }, [dispatch]);

  const handleAdminSelect = async (adminId) => {
    setSelectedAdminId(adminId);
    const admin = tenants?.find(tenant => tenant.admin?._id === adminId);
    setSelectedAdmin(admin?.admin);
    
    // Reset selections
    setSelectedParticipant(null);
    dispatch(setActiveRoom(null));
    
    // Fetch chat participants for selected admin
    setLoading(true);
    try {
      const result = await dispatch(fetchAdminChats(adminId));
      if (result.payload) {
        setChatParticipants(result.payload.data || []);
      }
    } catch (error) {
      console.error('Error fetching admin chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantSelect = (participant) => {
    setSelectedParticipant(participant);
    dispatch(setActiveRoom(participant.roomId));
    dispatch(fetchMessages({ roomId: participant.roomId, page: 1 }));
  };

  if (!user) return null;

  return (
    <div className="h-screen p-4">
      {/* Admin Selector */}
      <Card className="mb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <UserOutlined className="text-xl text-blue-600" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Select Admin to View Chats</h3>
            <Select
              placeholder="Choose an admin to view their chats"
              style={{ width: '100%', maxWidth: 400 }}
              size="large"
              value={selectedAdminId}
              onChange={handleAdminSelect}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {tenants?.map((tenant) => (
                <Option key={tenant.admin?._id} value={tenant.admin?._id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tenant.admin?.name}</span>
                    <span className="text-gray-500">({tenant.admin?.email})</span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          {selectedAdmin && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Viewing chats for:</p>
              <p className="font-semibold">{selectedAdmin.name}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Chat Interface */}
      {selectedAdminId ? (
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
                <h2 className="text-lg font-bold text-gray-800">{selectedAdmin?.name}'s Conversations</h2>
                <p className="text-xs text-gray-500 mt-1">{chatParticipants.length} people</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading conversations...</div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {Array.isArray(chatParticipants) && chatParticipants.map((participant) => (
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
            {/* Read-only Chat Window */}
            <div
              className="h-full flex flex-col rounded-2xl overflow-hidden border border-gray-200/60 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 255, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-4 border-b border-gray-100/60 flex items-center gap-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 255, 0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">
                    {selectedParticipant ? `${selectedAdmin?.name} & ${selectedParticipant.participantName}` : 'Select a conversation'}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Read-only mode
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              {activeRoomId ? (
                <MessageList messages={messagesByRoom[activeRoomId] || []} />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <UserOutlined className="text-4xl mb-4" />
                    <p>Select a chat to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Card className="h-[calc(100%-140px)] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <UserOutlined className="text-6xl mb-4" />
            <h3 className="text-xl mb-2">No Admin Selected</h3>
            <p>Please select an admin from the dropdown above to view their chats</p>
          </div>
        </Card>
      )}
    </div>
  );
}