import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { fetchContacts, searchUsers, addContact, removeContact, clearSearchResults } from '../../redux/slices/contactSlice';
import { Input, message, Spin, Empty, Avatar, Popconfirm, Modal } from 'antd';
import { UserAddOutlined, SearchOutlined, PhoneOutlined, MailOutlined, DeleteOutlined, MessageOutlined, UserOutlined, CloseOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createDirectRoom } from '../../redux/slices/chatSlice';

export default function Contacts() {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contacts, searchResults, loading, searchLoading } = useSelector((s) => s.contacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [addContactMode, setAddContactMode] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [notFoundMessage, setNotFoundMessage] = useState('');

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  const handleSearchUser = async () => {
    if (!phoneInput && !emailInput) {
      message.warning('Enter phone or email to search');
      return;
    }

    setSearchingUser(true);
    setFoundUser(null);
    setNotFoundMessage('');

    try {
      const query = phoneInput || emailInput;
      const result = await dispatch(searchUsers(query)).unwrap();
      
      if (result?.users && result.users.length > 0) {
        setFoundUser(result.users[0]);
        setNameInput(result.users[0].name);
      } else if (result?.data?.users && result.data.users.length > 0) {
        setFoundUser(result.data.users[0]);
        setNameInput(result.data.users[0].name);
      } else {
        setNotFoundMessage('This person is not on the platform');
      }
    } catch (error) {
      setNotFoundMessage('This person is not on the platform');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAddContact = async () => {
    if (!foundUser) {
      message.error('Please search and verify user first');
      return;
    }

    try {
      await dispatch(addContact({
        userId: foundUser._id,
        phone: phoneInput,
        email: emailInput,
        contactName: nameInput,
      })).unwrap();
      
      message.success('Contact added successfully');
      dispatch(fetchContacts());
      setAddContactMode(false);
      setPhoneInput('');
      setEmailInput('');
      setNameInput('');
      setFoundUser(null);
      setNotFoundMessage('');
    } catch (error) {
      message.error(error || 'Failed to add contact');
    }
  };

  const handleRemoveContact = async (userId) => {
    try {
      await dispatch(removeContact(userId)).unwrap();
      message.success('Contact removed');
    } catch (error) {
      message.error(error || 'Failed to remove contact');
    }
  };

  const handleStartChat = async (userId) => {
    try {
      await dispatch(createDirectRoom({ userId })).unwrap();
      navigate('/user/chats');
    } catch (error) {
      message.error('Failed to start chat');
    }
  };

  const filteredContacts = (contacts || []).filter(contact => {
    if (!contact) return false;
    const name = (contact.contactName || contact.userId?.name || '').toLowerCase();
    const phone = (contact.phone || contact.userId?.phone || '').toLowerCase();
    const email = (contact.email || contact.userId?.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query) || email.includes(query);
  });

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
            const user = contact.userId;
            const displayName = contact.contactName || user?.name || 'Unknown';
            
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
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/profile/${user._id}`)}
                >
                  <Avatar
                    src={user?.avatar}
                    size={50}
                    style={{ backgroundColor: theme.avatarBackgroundColor || '#008069', flexShrink: 0 }}
                  >
                    {displayName.charAt(0)?.toUpperCase()}
                  </Avatar>
                </div>

                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/profile/${user._id}`)}
                >
                  <p className="font-medium text-[16px] truncate mb-1" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                    {displayName}
                  </p>
                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.timestampColor || '#667781' }}>
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneOutlined style={{ fontSize: '12px' }} />
                        {contact.phone}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <MailOutlined style={{ fontSize: '12px' }} />
                        {contact.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartChat(user._id)}
                    className="p-2 rounded-full transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#E9EDEF'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <MessageOutlined style={{ color: theme.sendButtonColor || '#008069', fontSize: '20px' }} />
                  </button>

                  <Popconfirm
                    title="Remove this contact?"
                    onConfirm={() => handleRemoveContact(user._id)}
                    okText="Remove"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <button
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
              image={<UserOutlined style={{ fontSize: '64px', color: theme.timestampColor || '#8696A0' }} />}
              description={
                <span style={{ color: theme.timestampColor || '#667781' }} className="text-sm">
                  {searchQuery ? 'No contacts found' : 'No contacts yet'}
                </span>
              }
            />
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <Modal
        open={addContactMode}
        onCancel={() => {
          setAddContactMode(false);
          setPhoneInput('');
          setEmailInput('');
          setNameInput('');
          setFoundUser(null);
          setNotFoundMessage('');
        }}
        footer={null}
        width={450}
        centered
        closeIcon={<CloseOutlined style={{ color: theme.timestampColor || '#667781' }} />}
        styles={{
          content: { backgroundColor: theme.modalBackgroundColor || '#FFFFFF' },
          header: { backgroundColor: theme.modalBackgroundColor || '#FFFFFF', borderBottom: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }
        }}
      >
        <div className="py-4">
          <h2 className="text-xl font-semibold mb-6" style={{ color: theme.modalTextColor || '#111B21' }}>
            Add New Contact
          </h2>

          {/* Phone Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: theme.modalTextColor || '#111B21' }}>
              Phone Number
            </label>
            <Input
              size="large"
              prefix={<PhoneOutlined style={{ color: theme.timestampColor || '#667781' }} />}
              placeholder="+1234567890"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onPressEnter={handleSearchUser}
              style={{
                borderRadius: '8px',
                backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
                color: theme.inputTextColor || '#111B21',
                borderColor: theme.sidebarBorderColor || '#E9EDEF',
              }}
            />
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: theme.modalTextColor || '#111B21' }}>
              Email (Optional)
            </label>
            <Input
              size="large"
              prefix={<MailOutlined style={{ color: theme.timestampColor || '#667781' }} />}
              placeholder="email@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onPressEnter={handleSearchUser}
              style={{
                borderRadius: '8px',
                backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
                color: theme.inputTextColor || '#111B21',
                borderColor: theme.sidebarBorderColor || '#E9EDEF',
              }}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearchUser}
            disabled={searchingUser || (!phoneInput && !emailInput)}
            className="w-full py-3 rounded-lg font-medium transition-colors mb-4"
            style={{
              backgroundColor: theme.sendButtonColor || '#008069',
              color: theme.sendButtonIconColor || '#FFFFFF',
              opacity: searchingUser || (!phoneInput && !emailInput) ? 0.5 : 1,
            }}
          >
            {searchingUser ? (
              <><Spin size="small" className="mr-2" style={{ color: theme.sendButtonIconColor || '#FFFFFF' }} /> Searching...</>
            ) : (
              <><SearchOutlined className="mr-2" /> Search User</>
            )}
          </button>

          {/* Found User */}
          {foundUser && (
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5', border: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}>
              <div className="flex items-center gap-3 mb-3">
                <CheckCircleOutlined style={{ color: theme.accentColor || '#25D366', fontSize: '24px' }} />
                <span className="font-medium" style={{ color: theme.modalTextColor || '#111B21' }}>
                  User found on platform
                </span>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <Avatar
                  src={foundUser.avatar}
                  size={50}
                  style={{ backgroundColor: theme.avatarBackgroundColor || '#008069' }}
                >
                  {foundUser.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div>
                  <p className="font-medium" style={{ color: theme.modalTextColor || '#111B21' }}>
                    {foundUser.name}
                  </p>
                  <p className="text-sm" style={{ color: theme.timestampColor || '#667781' }}>
                    {foundUser.phone || foundUser.email}
                  </p>
                </div>
              </div>

              {/* Contact Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.modalTextColor || '#111B21' }}>
                  Save as
                </label>
                <Input
                  size="large"
                  prefix={<UserOutlined style={{ color: theme.timestampColor || '#667781' }} />}
                  placeholder="Contact name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{
                    borderRadius: '8px',
                    backgroundColor: theme.modalBackgroundColor || '#FFFFFF',
                    color: theme.inputTextColor || '#111B21',
                    borderColor: theme.sidebarBorderColor || '#E9EDEF',
                  }}
                />
              </div>

              <button
                onClick={handleAddContact}
                disabled={!nameInput.trim()}
                className="w-full py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: theme.sendButtonColor || '#008069',
                  color: theme.sendButtonIconColor || '#FFFFFF',
                  opacity: !nameInput.trim() ? 0.5 : 1,
                }}
              >
                <UserAddOutlined className="mr-2" />
                Add to Contacts
              </button>
            </div>
          )}

          {/* Not Found Message */}
          {notFoundMessage && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFB74D' }}>
              <div className="flex items-center gap-3">
                <ExclamationCircleOutlined style={{ color: '#F57C00', fontSize: '24px' }} />
                <div>
                  <p className="font-medium" style={{ color: '#E65100' }}>
                    Not on Platform
                  </p>
                  <p className="text-sm" style={{ color: '#F57C00' }}>
                    This person hasn't joined yet. You can only add contacts who are registered on the platform.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
