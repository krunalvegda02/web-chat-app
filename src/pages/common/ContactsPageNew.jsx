import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { fetchContacts, searchUserByPhoneOrEmail, addContact, removeContact, updateContactName, clearSearchResults } from '../../redux/slices/contactSlice';
import { Input, message, Spin, Empty, Avatar, Modal, Button } from 'antd';
import { UserAddOutlined, SearchOutlined, ArrowLeftOutlined, MessageOutlined, DeleteOutlined, ShareAltOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createOrGetRoom } from '../../redux/slices/chatSlice';

export default function ContactsPage() {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contacts, searchedUser, loading, searchLoading } = useSelector((s) => s.contacts);
  const { user } = useSelector((s) => s.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [addContactMode, setAddContactMode] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [contactName, setContactName] = useState('');
  const [creatingChat, setCreatingChat] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [editContactName, setEditContactName] = useState('');

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  const handleSearchUser = () => {
    if (!searchInput || searchInput.length < 3) {
      message.warning('Enter at least 3 characters');
      return;
    }
    dispatch(searchUserByPhoneOrEmail(searchInput));
  };

  const handleAddContact = async () => {
    if (!searchedUser?.user) {
      message.error('No user found to add');
      return;
    }

    try {
      await dispatch(addContact({
        userId: searchedUser.user._id,
        contactName: contactName || searchedUser.user.name,
        phone: searchedUser.user.phone,
        email: searchedUser.user.email,
      })).unwrap();
      
      message.success('Contact added successfully');
      dispatch(fetchContacts());
      setAddContactMode(false);
      setSearchInput('');
      setContactName('');
      dispatch(clearSearchResults());
    } catch (error) {
      message.error(error || 'Failed to add contact');
    }
  };

  const handleRemoveContact = async (contactId) => {
    Modal.confirm({
      title: 'Delete contact?',
      content: 'This contact will be removed from your list.',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { 
        style: { backgroundColor: '#ea0038', borderColor: '#ea0038' }
      },
      cancelButtonProps: {
        style: { color: '#00a884' }
      },
      centered: true,
      onOk: async () => {
        try {
          await dispatch(removeContact(contactId)).unwrap();
          message.success('Contact removed');
        } catch (error) {
          message.error(error || 'Failed to remove contact');
        }
      }
    });
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setEditContactName(contact.contactName || contact.contactUserId?.name || '');
  };

  const handleSaveContactName = async () => {
    if (!editContactName.trim()) {
      message.error('Contact name cannot be empty');
      return;
    }
    try {
      await dispatch(updateContactName({ 
        contactId: editingContact._id, 
        contactName: editContactName.trim() 
      })).unwrap();
      message.success('Contact name updated');
      setEditingContact(null);
      dispatch(fetchContacts());
    } catch (error) {
      message.error(error || 'Failed to update contact name');
    }
  };

  const handleStartChat = async (userId) => {
    setCreatingChat(userId);
    try {
      const result = await dispatch(createOrGetRoom({ userId })).unwrap();
      const roomId = result?.data?.room?._id || result?.room?._id;
      
      const chatPath = user?.role === 'SUPER_ADMIN' 
        ? '/super-admin/chats'
        : user?.role === 'TENANT_ADMIN' || user?.role === 'PLATFORM_ADMIN'
        ? '/admin'
        : '/user/chats';
      
      if (roomId) {
        navigate(`${chatPath}?roomId=${roomId}`);
      } else {
        navigate(chatPath);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to start chat');
    } finally {
      setCreatingChat(null);
    }
  };

  const handleInvite = () => {
    const inviteText = `Join me on our chat platform!`;
    if (navigator.share) {
      navigator.share({ text: inviteText });
    } else {
      navigator.clipboard.writeText(inviteText);
      message.success('Invite link copied to clipboard');
    }
  };

  const filteredContacts = (contacts || []).filter(contact => {
    if (!contact) return false;
    const name = (contact.contactName || contact.contactUserId?.name || '').toLowerCase();
    const phone = (contact.phone || contact.contactUserId?.phone || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  if (addContactMode) {
    return (
      <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex flex-col" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-4" style={{ background: theme?.sidebarHeaderColor || '#008069' }}>
          <button onClick={() => {
            setAddContactMode(false);
            setSearchInput('');
            setContactName('');
            dispatch(clearSearchResults());
          }} className="p-2 hover:bg-white/20 rounded-full">
            <ArrowLeftOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: '20px' }} />
          </button>
          <h1 className="text-xl font-medium" style={{ color: theme.headerTextColor || '#FFFFFF' }}>Add contact</h1>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b" style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }}>
          <Input
            placeholder="Enter phone number or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearchUser}
            size="large"
            style={{
              borderRadius: '8px',
              backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
              border: 'none',
              marginBottom: '12px'
            }}
          />
          <Button
            type="primary"
            onClick={handleSearchUser}
            loading={searchLoading}
            block
            size="large"
            style={{ backgroundColor: '#00a884', borderColor: '#00a884', borderRadius: '8px' }}
          >
            Search
          </Button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {searchLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spin size="large" />
            </div>
          ) : searchedUser ? (
            searchedUser.found ? (
              <div className="p-4">
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                  <Avatar
                    src={searchedUser.user.avatar}
                    size={56}
                    style={{ backgroundColor: theme.avatarBackgroundColor || '#008069' }}
                  >
                    {searchedUser.user.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-base" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                      {searchedUser.user.name}
                    </p>
                    <p className="text-sm" style={{ color: theme.timestampColor || '#667781' }}>
                      {searchedUser.user.phone || searchedUser.user.email}
                    </p>
                  </div>
                  {searchedUser.user.isContact ? (
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#00a884' }} />
                  ) : null}
                </div>

                {!searchedUser.user.isContact && (
                  <div className="mt-4">
                    <Input
                      placeholder="Contact name (optional)"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
                        border: 'none',
                        marginBottom: '12px'
                      }}
                    />
                    <Button
                      type="primary"
                      onClick={handleAddContact}
                      block
                      size="large"
                      icon={<UserAddOutlined />}
                      style={{ backgroundColor: '#00a884', borderColor: '#00a884', borderRadius: '8px' }}
                    >
                      Add Contact
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="mb-4" style={{ fontSize: '64px', color: theme.timestampColor || '#667781' }}>
                  <UserAddOutlined />
                </div>
                <p className="text-lg font-medium mb-2" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                  User not found
                </p>
                <p className="text-sm mb-6" style={{ color: theme.timestampColor || '#667781' }}>
                  This person is not on the platform yet
                </p>
                <Button
                  type="primary"
                  icon={<ShareAltOutlined />}
                  onClick={handleInvite}
                  size="large"
                  style={{ backgroundColor: '#00a884', borderColor: '#00a884', borderRadius: '8px' }}
                >
                  Invite to Platform
                </Button>
              </div>
            )
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex flex-col" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between" style={{ background: theme?.sidebarHeaderColor || '#008069' }}>
        <h1 className="text-xl font-medium" style={{ color: theme.headerTextColor || '#FFFFFF' }}>Contacts</h1>
        <button
          onClick={() => setAddContactMode(true)}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <UserAddOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: '20px' }} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b" style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF', backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
        <Input
          placeholder="Search contacts..."
          prefix={<SearchOutlined style={{ color: theme.timestampColor || '#667781' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          size="large"
          style={{
            borderRadius: '8px',
            backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
            border: 'none',
          }}
        />
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
          </div>
        ) : filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => {
            const contactUser = contact.contactUserId;
            const displayName = contact.contactName || contactUser?.name || 'Unknown';
            
            return (
              <div
                key={contact._id}
                className="flex items-center gap-3 px-6 py-3 border-b transition-colors group"
                style={{ 
                  borderColor: theme.sidebarBorderColor || '#E9EDEF',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Avatar
                  src={contactUser?.avatar}
                  size={50}
                  style={{ backgroundColor: theme.avatarBackgroundColor || '#008069', flexShrink: 0 }}
                >
                  {displayName.charAt(0)?.toUpperCase()}
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[16px] truncate mb-1" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                    {displayName}
                  </p>
                  <p className="text-sm truncate" style={{ color: theme.timestampColor || '#667781' }}>
                    {contact.phone || contactUser?.phone || contactUser?.email}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartChat(contactUser._id)}
                    disabled={creatingChat === contactUser._id}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110"
                    style={{ 
                      backgroundColor: '#25D366',
                      opacity: creatingChat === contactUser._id ? 0.5 : 1
                    }}
                  >
                    {creatingChat === contactUser._id ? <Spin size="small" /> : <MessageOutlined style={{ color: '#FFFFFF', fontSize: '16px' }} />}
                  </button>
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110"
                    style={{ backgroundColor: '#128C7E', color: '#FFFFFF' }}
                  >
                    <EditOutlined style={{ fontSize: '16px' }} />
                  </button>
                  <button
                    onClick={() => handleRemoveContact(contact._id)}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                    style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}
                  >
                    <DeleteOutlined style={{ fontSize: '16px' }} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Empty
              description={
                <span style={{ color: theme.timestampColor || '#667781' }}>
                  No contacts yet. Add your first contact!
                </span>
              }
            />
          </div>
        )}
      </div>

      {/* Edit Contact Name Modal */}
      <Modal
        title="Edit Contact Name"
        open={!!editingContact}
        onCancel={() => setEditingContact(null)}
        onOk={handleSaveContactName}
        okText="Save"
        cancelText="Cancel"
        centered
        okButtonProps={{ style: { backgroundColor: '#00a884', borderColor: '#00a884' } }}
      >
        <Input
          value={editContactName}
          onChange={(e) => setEditContactName(e.target.value)}
          placeholder="Enter contact name"
          maxLength={50}
          onPressEnter={handleSaveContactName}
          size="large"
          style={{
            borderRadius: '8px',
            backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
            border: 'none',
          }}
        />
      </Modal>
    </div>
  );
}
