import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { Button, Spin, message as antMessage, Modal, Divider } from 'antd';
import {
  ArrowLeftOutlined,
  MessageOutlined,
  PhoneOutlined,
  UserDeleteOutlined,
  UserAddOutlined,
  StarOutlined,
  StarFilled,
  MailOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import Avatar from '../../components/common/Avatar';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveRoom } from '../../redux/slices/chatSlice';
import { 
  getUserById, 
  addContact, 
  removeContact, 
  toggleFavorite, 
  blockUser, 
  unblockUser,
  clearViewedUser 
} from '../../redux/slices/userSlice';
import { useCall } from '../../contexts/CallContext';

export default function UserProfile() {
  const { userId } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { viewedUser, loading } = useSelector((s) => s.user);
  const { rooms, onlineUsers } = useSelector((s) => s.chat);
  const { user: currentUser } = useSelector((s) => s.auth);
  const { initiateCall } = useCall();

  useEffect(() => {
    dispatch(getUserById(userId));
    return () => dispatch(clearViewedUser());
  }, [userId, dispatch]);

  const user = viewedUser?.user || viewedUser;
  const isContact = viewedUser?.isContact;
  const isFavorite = viewedUser?.isFavorite;
  const isBlocked = viewedUser?.isBlocked;
  
  const otherParticipant = user;
  const isOtherUserOnline = user && onlineUsers.includes(user._id);

  const handleStartChat = async () => {
    try {
      const roomsArray = Array.isArray(rooms) ? rooms : rooms?.data?.rooms || rooms?.rooms || rooms?.data || [];
      const existingRoom = roomsArray.find(room => 
        room.participants?.some(p => p.userId?._id === userId || p.userId === userId)
      );

      if (existingRoom) {
        dispatch(setActiveRoom(existingRoom._id));
        // Navigate with state to open chat directly
        if (currentUser?.role === 'USER') {
          navigate('/user/chats', { state: { openChat: true } });
        } else if (currentUser?.role === 'ADMIN' || currentUser?.role === 'TENANT_ADMIN') {
          navigate('/admin', { state: { openChat: true } });
        } else if (currentUser?.role === 'SUPER_ADMIN') {
          navigate('/super-admin', { state: { openChat: true } });
        } else {
          navigate(-1);
        }
      } else {
        antMessage.info('Start a conversation by sending a message from Contacts');
      }
    } catch (error) {
      console.error('Start chat error:', error);
      antMessage.error('Failed to start chat');
    }
  };

  const handleAudioCall = () => {
    if (!otherParticipant) {
      antMessage.error('Cannot start call: User not found');
      return;
    }
    if (!isOtherUserOnline) {
      antMessage.warning('User is offline');
      return;
    }
    // Use the same call functionality from ChatWindow
    initiateCall(otherParticipant, null);
  };

  const handleAddContact = async () => {
    try {
      await dispatch(addContact({ userId })).unwrap();
      antMessage.success('Contact added');
    } catch (error) {
      antMessage.error('Failed to add contact');
    }
  };

  const handleRemoveContact = () => {
    Modal.confirm({
      title: 'Remove Contact',
      content: `Remove ${user?.name} from your contacts?`,
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await dispatch(removeContact(userId)).unwrap();
          antMessage.success('Contact removed');
        } catch (error) {
          antMessage.error('Failed to remove contact');
        }
      },
    });
  };

  const handleToggleFavorite = async () => {
    try {
      await dispatch(toggleFavorite({ userId, isFavorite })).unwrap();
      antMessage.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      antMessage.error('Failed to update favorite');
    }
  };

  const handleBlockUser = () => {
    Modal.confirm({
      title: isBlocked ? 'Unblock User' : 'Block User',
      content: isBlocked
        ? `Unblock ${user?.name}? You will be able to receive messages from them.`
        : `Block ${user?.name}? You will no longer receive messages from them.`,
      okText: isBlocked ? 'Unblock' : 'Block',
      okType: 'danger',
      onOk: async () => {
        try {
          if (isBlocked) {
            await dispatch(unblockUser(userId)).unwrap();
            antMessage.success('User unblocked');
          } else {
            await dispatch(blockUser(userId)).unwrap();
            antMessage.success('User blocked');
          }
        } catch (error) {
          antMessage.error('Failed to update block status');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 sm:left-20 flex items-center justify-center" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 sm:left-20 flex flex-col" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5" style={{ backgroundColor: theme.headerBackgroundColor || '#008069' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ fontSize: '20px', color: theme.headerTextColor || '#FFFFFF' }} />}
          onClick={() => navigate(-1)}
          style={{ padding: 0 }}
        />
        <h1 className="text-xl font-medium" style={{ color: theme.headerTextColor || '#FFFFFF' }}>
          Contact Info
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-8 px-6" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
          <Avatar src={user?.avatar} name={user?.name} size={200} />
          <h2 className="text-2xl font-medium mt-4" style={{ color: theme.sidebarTextColor || '#111B21' }}>
            {user?.name}
          </h2>
          {user?.phone && (
            <p className="text-sm mt-2" style={{ color: theme.timestampColor || '#667781' }}>
              {user.phone}
            </p>
          )}
          {user?.bio && (
            <p className="text-sm mt-2 text-center max-w-md" style={{ color: theme.timestampColor || '#667781' }}>
              {user.bio}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 px-6 py-6" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF', borderTop: `8px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}>
          <button
            onClick={handleStartChat}
            className="flex flex-col items-center gap-2 p-4 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}
          >
            <MessageOutlined style={{ fontSize: '24px', color: theme.primaryColor || '#008069' }} />
            <span className="text-xs" style={{ color: theme.sidebarTextColor || '#111B21' }}>
              Message
            </span>
          </button>

          <button
            onClick={handleAudioCall}
            className="flex flex-col items-center gap-2 p-4 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}
          >
            <PhoneOutlined style={{ fontSize: '24px', color: theme.primaryColor || '#008069' }} />
            <span className="text-xs" style={{ color: theme.sidebarTextColor || '#111B21' }}>
              Audio
            </span>
          </button>
        </div>

        {/* Info Section */}
        <div className="px-6 py-4" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF', borderTop: `8px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: theme.primaryColor || '#008069' }}>
            Contact Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MailOutlined style={{ fontSize: '18px', color: theme.timestampColor || '#667781', marginTop: '2px' }} />
              <div className="flex-1">
                <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Email</p>
                <p className="text-sm font-medium" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                  {user?.email}
                </p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-start gap-3">
                <PhoneOutlined style={{ fontSize: '18px', color: theme.timestampColor || '#667781', marginTop: '2px' }} />
                <div className="flex-1">
                  <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Phone</p>
                  <p className="text-sm font-medium" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                    {user.phone}
                  </p>
                  {user.phoneVerified && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircleOutlined style={{ fontSize: '12px', color: '#10B981' }} />
                      <span className="text-xs" style={{ color: '#10B981' }}>Verified</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <CalendarOutlined style={{ fontSize: '18px', color: theme.timestampColor || '#667781', marginTop: '2px' }} />
              <div className="flex-1">
                <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Member Since</p>
                <p className="text-sm font-medium" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                  {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="px-6 py-4" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF', borderTop: `8px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}>
          {isContact ? (
            <>
              <button
                onClick={handleToggleFavorite}
                className="flex items-center gap-4 w-full py-3 px-4 rounded-lg mb-3 transition-all hover:opacity-80"
                style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}
              >
                {isFavorite ? (
                  <StarFilled style={{ fontSize: '20px', color: '#FFD700' }} />
                ) : (
                  <StarOutlined style={{ fontSize: '20px', color: theme.sidebarTextColor || '#111B21' }} />
                )}
                <span style={{ color: theme.sidebarTextColor || '#111B21' }}>
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </span>
              </button>

              <button
                onClick={handleRemoveContact}
                className="flex items-center gap-4 w-full py-3 px-4 rounded-lg mb-3 transition-all hover:opacity-80"
                style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}
              >
                <UserDeleteOutlined style={{ fontSize: '20px', color: '#EF4444' }} />
                <span style={{ color: '#EF4444' }}>Remove Contact</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleAddContact}
              className="flex items-center gap-4 w-full py-3 px-4 rounded-lg mb-3 transition-all hover:opacity-80"
              style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}
            >
              <UserAddOutlined style={{ fontSize: '20px', color: theme.primaryColor || '#008069' }} />
              <span style={{ color: theme.primaryColor || '#008069' }}>Add to Contacts</span>
            </button>
          )}

          {/* <button
            onClick={handleBlockUser}
            className="flex items-center gap-4 w-full py-3 px-4 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}
          >
            <UserDeleteOutlined style={{ fontSize: '20px', color: '#EF4444' }} />
            <span style={{ color: '#EF4444' }}>
              {isBlocked ? 'Unblock User' : 'Block User'}
            </span>
          </button> */}
        </div>
      </div>
    </div>
  );
}
