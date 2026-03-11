import { useState, useEffect } from 'react';
import { Modal, Input, Button, message as antMessage, Checkbox } from 'antd';
import { SearchOutlined, ShareAltOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';
import { useDispatch, useSelector } from 'react-redux';
import { forwardMessageAPI, fetchRooms } from '../../redux/slices/chatSlice';
import { _get } from '../../helper/apiClient';
import Avatar from '../common/Avatar';

export default function ForwardMessageModal({ open, onCancel, message }) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { rooms } = useSelector((s) => s.chat);
  
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentChats, setRecentChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Fetch recent chats for Super Admin
  useEffect(() => {
    if (open && isSuperAdmin) {
      fetchRecentChats(1);
    }
  }, [open, isSuperAdmin]);

  const fetchRecentChats = async (pageNum) => {
    if (chatsLoading) return;
    
    setChatsLoading(true);
    try {
      const response = await _get(`/chat/rooms?page=${pageNum}&limit=20`);
      const newChats = response.data?.data?.rooms || response.data?.rooms || [];
      
      if (pageNum === 1) {
        setRecentChats(newChats);
      } else {
        setRecentChats(prev => [...prev, ...newChats]);
      }
      
      setHasMore(newChats.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch recent chats:', error);
      antMessage.error('Failed to load chats');
    } finally {
      setChatsLoading(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !chatsLoading) {
      fetchRecentChats(page + 1);
    }
  };

  const handleForwardSubmit = async () => {
    if (selectedRooms.length === 0) {
      antMessage.error('Please select at least one chat');
      return;
    }

    setForwardLoading(true);
    try {
      await dispatch(forwardMessageAPI({ messageId: message._id, roomIds: selectedRooms })).unwrap();
      antMessage.success(`Forwarded to ${selectedRooms.length} chat(s)`);
      onCancel();
      setSelectedRooms([]);
      dispatch(fetchRooms());
    } catch (error) {
      antMessage.error('Failed to forward message');
    } finally {
      setForwardLoading(false);
    }
  };

  // Get chat list based on user role
  const chatList = isSuperAdmin ? recentChats : (Array.isArray(rooms) ? rooms : []);

  // Filter chats by search query
  const filteredChats = chatList.filter(room => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const otherParticipant = room.participants?.find(p => p.userId?._id !== user?._id);
    const displayName = room.type === 'DIRECT' || room.type === 'ADMIN_CHAT'
      ? otherParticipant?.userId?.name || room.name
      : room.name;
    
    return displayName?.toLowerCase().includes(query);
  });

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid #E9EDEF' }}>
          <ShareAltOutlined style={{ color: theme.primaryColor, fontSize: '20px' }} />
          <span style={{ fontSize: '18px', fontWeight: 500 }}>Forward message to...</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={420}
      centered
      styles={{
        header: { padding: '16px 24px 0', marginBottom: 0 },
        body: { padding: '16px 0 0' }
      }}
    >
      <div className="flex flex-col" style={{ height: '500px' }}>
        {/* Search */}
        <div className="px-6 pb-3">
          <Input
            placeholder="Search chats..."
            prefix={<SearchOutlined style={{ color: '#8696A0' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="large"
            style={{ borderRadius: '8px', backgroundColor: '#F0F2F5', border: 'none' }}
          />
        </div>

        {/* Chat List */}
        <div 
          className="flex-1 overflow-y-auto" 
          style={{ maxHeight: '360px' }}
          onScroll={isSuperAdmin ? handleScroll : undefined}
        >
          {filteredChats.map((room) => {
            const otherParticipant = room.participants?.find(p => p.userId?._id !== user?._id);
            const displayName = room.type === 'DIRECT' || room.type === 'ADMIN_CHAT'
              ? otherParticipant?.userId?.name || room.name
              : room.name;
            const isSelected = selectedRooms.includes(room._id);
            
            return (
              <div
                key={room._id}
                onClick={() => {
                  setSelectedRooms(prev =>
                    prev.includes(room._id)
                      ? prev.filter(id => id !== room._id)
                      : [...prev, room._id]
                  );
                }}
                className="flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected ? '#F0F2F5' : 'transparent',
                }}
                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#F5F6F6')}
                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div className="relative">
                  <Avatar size={48} name={displayName} style={{ backgroundColor: theme.primaryColor }} />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primaryColor }}>
                      <CheckOutlined style={{ color: 'white', fontSize: '10px' }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: '#111B21' }}>{displayName}</div>
                  <div className="text-xs truncate" style={{ color: '#667781' }}>
                    {room.lastMessage?.content || 'Tap to forward here'}
                  </div>
                </div>
              </div>
            );
          })}
          
          {chatsLoading && (
            <div className="flex justify-center py-4">
              <LoadingOutlined style={{ fontSize: '24px', color: theme.primaryColor }} />
            </div>
          )}
          
          {!chatsLoading && filteredChats.length === 0 && (
            <div className="text-center py-8" style={{ color: '#667781' }}>
              {searchQuery ? 'No chats found' : 'No recent chats'}
            </div>
          )}
        </div>

        {/* Footer with Send Button */}
        <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #E9EDEF', backgroundColor: '#F0F2F5' }}>
          <div className="text-sm" style={{ color: '#667781' }}>
            {selectedRooms.length > 0 ? `${selectedRooms.length} selected` : 'Select chats'}
          </div>
          <Button
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={handleForwardSubmit}
            loading={forwardLoading}
            disabled={selectedRooms.length === 0}
            size="large"
            style={{
              backgroundColor: selectedRooms.length > 0 ? theme.primaryColor : '#D1D7DB',
              borderColor: selectedRooms.length > 0 ? theme.primaryColor : '#D1D7DB',
              borderRadius: '24px',
              paddingLeft: '24px',
              paddingRight: '24px',
              fontWeight: 500
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </Modal>
  );
}
