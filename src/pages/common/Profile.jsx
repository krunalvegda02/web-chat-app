import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { 
  Input, Button, message as antMessage, Divider, Spin, Modal, Tooltip, 
  Card, Segmented, Space, Badge, Progress, Statistic, Empty, Collapse
} from 'antd';
import { 
  ArrowLeftOutlined, 
  CameraOutlined, 
  CheckOutlined, 
  EditOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  UserOutlined,
  LockOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  SaveOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SafetyCertificateOutlined,
  CameraFilled,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import { updateProfile } from '../../redux/slices/authSlice';
import { updateProfileWithAvatar } from '../../redux/slices/userSlice';

export default function Profile() {
  const { theme } = useTheme();
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRemoveAvatar, setShowRemoveAvatar] = useState(false);
  const [copied, setCopied] = useState(null);
  const fileInputRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleAvatarUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      antMessage.error({
        content: 'Please upload an image file',
        icon: <InfoCircleOutlined />,
      });
      return false;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      antMessage.error({
        content: 'Image size should be less than 5MB',
        icon: <InfoCircleOutlined />,
      });
      return false;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('bio', bio);

      const result = await dispatch(updateProfileWithAvatar(formData));
      
      if (result.type.endsWith('/fulfilled')) {
        setAvatar(result.payload.data.user.avatar);
        antMessage.success({
          content: 'Profile photo uploaded',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          duration: 2,
        });
      } else {
        throw new Error(result.payload || 'Failed to upload photo');
      }
    } catch (error) {
      antMessage.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    setShowRemoveAvatar(false);
    antMessage.success({
      content: 'Profile photo removed',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      antMessage.error('Name is required');
      return;
    }

    if (phone && !isPhoneValid(phone)) {
      antMessage.error('Please enter a valid phone number');
      return;
    }

    setSaving(true);
    try {
      const result = await dispatch(updateProfile({ 
        name: name.trim(), 
        phone: phone.trim(), 
        avatar,
        bio: bio.trim()
      }));
      
      if (result.type.endsWith('/fulfilled')) {
        antMessage.success({
          content: 'Profile updated successfully',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          duration: 2,
        });
        setEditing(false);
      } else {
        throw new Error(result.payload || 'Failed to update profile');
      }
    } catch (error) {
      antMessage.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setBio(user?.bio || '');
    setAvatar(user?.avatar || '');
    setEditing(false);
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Not set';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
    }
    return phone;
  };

  const isPhoneValid = (phone) => {
    if (!phone) return true;
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    antMessage.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const memberSince = new Date(user?.createdAt).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric',
    day: 'numeric'
  });

  // Responsive avatar size
  const getAvatarSize = () => {
    if (windowWidth < 640) return 80;
    if (windowWidth < 1024) return 100;
    return 120;
  };

  // Responsive padding
  const getHeaderPadding = () => {
    if (windowWidth < 640) return 'px-3 py-2';
    if (windowWidth < 1024) return 'px-4 py-2.5';
    return 'px-6 py-3';
  };

  // Responsive text size
  const getHeaderTextSize = () => {
    if (windowWidth < 640) return 'text-base';
    if (windowWidth < 1024) return 'text-lg';
    return 'text-xl';
  };

  return (
    <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex flex-col w-full" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
      {/* Premium Header - Fully Responsive */}
      <div 
        className={`${getHeaderPadding()} flex items-center justify-between shadow-md sticky top-0 z-40 w-full`}
        style={{ backgroundColor: theme.sidebarHeaderColor || '#008069' }}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-1 sm:p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeftOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: windowWidth < 640 ? '18px' : '20px' }} />
          </button>
          <h1 className={`${getHeaderTextSize()} sm:text-lg font-medium truncate`} style={{ color: theme.headerTextColor || '#FFFFFF' }}>Profile</h1>
        </div>
        
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          >
            <EditOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: windowWidth < 640 ? '18px' : '20px' }} />
          </button>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleCancel}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <CloseOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: windowWidth < 640 ? '18px' : '20px' }} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || (phone && !isPhoneValid(phone))}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            >
              {saving ? (
                <LoadingOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: windowWidth < 640 ? '18px' : '20px' }} spin />
              ) : (
                <CheckOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: windowWidth < 640 ? '18px' : '20px' }} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content - Fully Responsive */}
      <div className="flex-1 overflow-y-auto w-full pb-32 sm:pb-20 md:pb-0" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        
          {/* Profile Card - Fully Responsive */}
          <div className="mb-4 sm:mb-6">
            <Card 
              className="shadow-sm w-full"
              bodyStyle={{ padding: 0 }}
              bordered={false}
              style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}
            >
              <div className="p-3 sm:p-4 md:p-6" style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF', color: theme.modalTextColor || '#111B21' }}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 md:gap-6">
                  {/* Avatar Section - Responsive */}
                  <div className="relative group flex-shrink-0 w-full sm:w-auto flex sm:flex-col justify-center sm:justify-start">
                    <Avatar 
                      src={avatar} 
                      name={name} 
                      size={getAvatarSize()}
                      style={{ backgroundColor: theme.avatarBackgroundColor || '#008069' }}
                    />
                    {editing && (
                      <>
                        <div
                          className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100 bg-black/60"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ width: getAvatarSize(), height: getAvatarSize() }}
                        >
                          <div className="text-center">
                            {uploading ? (
                              <Spin indicator={<LoadingOutlined className="text-white text-2xl sm:text-3xl" spin />} />
                            ) : (
                              <>
                                <CameraFilled className="text-2xl sm:text-3xl text-white mb-1 sm:mb-2" />
                                <p className="text-white text-xs font-semibold">Update</p>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Add/Change Button - Responsive */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 px-2 sm:px-2.5 py-1 sm:py-1.5 text-white text-xs font-semibold rounded-full shadow-lg hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-0.5 sm:gap-1"
                          style={{ backgroundColor: theme.sendButtonColor || '#008069' }}
                        >
                          <UploadOutlined className="text-xs" />
                          <span className="hidden sm:inline">{avatar ? 'Change' : 'Add'}</span>
                          <span className="sm:hidden">{avatar ? 'Edit' : '+'}</span>
                        </button>
                      </>
                    )}

                    {/* Remove Avatar Button - Responsive */}
                    {editing && avatar && (
                      <Tooltip title="Remove photo">
                        <button
                          onClick={() => setShowRemoveAvatar(true)}
                          className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 text-base sm:text-lg leading-none"
                          style={{ 
                            backgroundColor: theme.errorColor || '#ff4d4f',
                            color: '#FFFFFF'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.errorColor ? `${theme.errorColor}dd` : '#ff4d4fdd'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.errorColor || '#ff4d4f'}
                        >
                          ×
                        </button>
                      </Tooltip>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* User Info Section - Fully Responsive */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    {!editing ? (
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold truncate" style={{ color: theme.sidebarTextColor || '#111B21' }}>{name}</h2>
                          <p className="text-xs sm:text-sm font-medium truncate" style={{ color: theme.timestampColor || '#667781' }}>@{user?.username || 'username'}</p>
                        </div>
                        
                        {bio && (
                          <p className="text-xs sm:text-sm md:text-base leading-relaxed max-w-xl break-words" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                            {bio}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-1 sm:gap-2 pt-1 sm:pt-2">
                          <Badge 
                            icon={<CheckCircleOutlined />} 
                            color="success" 
                            text={<span className="text-xs font-medium">Verified</span>} 
                          />
                          <Badge 
                            icon={<GlobalOutlined />} 
                            color="processing" 
                            text={<span className="text-xs font-medium">Active</span>} 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4 w-full">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: theme.modalTextColor || '#111B21' }}>
                            Full Name
                          </label>
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                            showCount
                            size={windowWidth < 640 ? 'middle' : 'large'}
                            placeholder="Enter your full name"
                            prefix={<UserOutlined style={{ color: theme.timestampColor || '#667781' }} />}
                            className="rounded-lg text-xs sm:text-sm"
                            style={{
                              backgroundColor: theme.inputBackgroundColor || '#F8F9FA',
                              color: theme.inputTextColor || '#111B21',
                              borderColor: theme.sidebarBorderColor || '#E9EDEF',
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: theme.modalTextColor || '#111B21' }}>
                            Bio / About
                          </label>
                          <Input.TextArea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={160}
                            showCount
                            placeholder="Tell something about yourself..."
                            rows={windowWidth < 640 ? 2 : 3}
                            className="rounded-lg text-xs sm:text-sm"
                            style={{
                              backgroundColor: theme.inputBackgroundColor || '#F8F9FA',
                              color: theme.inputTextColor || '#111B21',
                              borderColor: theme.sidebarBorderColor || '#E9EDEF',
                            }}
                          />
                          <p className="text-xs mt-1.5 sm:mt-2" style={{ color: theme.timestampColor || '#667781' }}>
                            Keep it brief (max 160 characters)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats on Right - Desktop Only */}
                  {!editing && windowWidth >= 1024 && (
                    <div className="hidden lg:flex flex-col gap-3 pl-6" style={{ borderLeft: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: theme.sendButtonColor || '#10b981' }}>{user?.contactCount || 0}</div>
                        <div className="text-xs font-medium" style={{ color: theme.timestampColor || '#667781' }}>Contacts</div>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: theme.accentColor || '#3b82f6' }}>{user?.messageCount || 0}</div>
                        <div className="text-xs font-medium" style={{ color: theme.timestampColor || '#667781' }}>Messages</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Grid - Tablet & Mobile - Fully Responsive */}
          {!editing && windowWidth < 1024 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
              <Card className="shadow-sm w-full" bodyStyle={{ padding: windowWidth < 640 ? '10px' : '12px' }} style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}>
                <Statistic
                  title={<span className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Contacts</span>}
                  value={user?.contactCount || 0}
                  valueStyle={{ color: theme.accentColor || '#10b981', fontSize: windowWidth < 640 ? '16px' : '18px' }}
                />
              </Card>
              <Card className="shadow-sm w-full" bodyStyle={{ padding: windowWidth < 640 ? '10px' : '12px' }} style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}>
                <Statistic
                  title={<span className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Messages</span>}
                  value={user?.messageCount || 0}
                  valueStyle={{ color: theme.sendButtonColor || '#3b82f6', fontSize: windowWidth < 640 ? '16px' : '18px' }}
                />
              </Card>
              <Card className="shadow-sm w-full" bodyStyle={{ padding: windowWidth < 640 ? '10px' : '12px' }} style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}>
                <Statistic
                  title={<span className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Member</span>}
                  value={new Date(user?.createdAt).getFullYear()}
                  valueStyle={{ color: theme.avatarBackgroundColor || '#8b5cf6', fontSize: windowWidth < 640 ? '16px' : '18px' }}
                />
              </Card>
            </div>
          )}

          {/* Account Information Section - Fully Responsive */}
          {!editing && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              
              {/* Main Info Card - Fully Responsive */}
              <div className="lg:col-span-2 w-full">
                <Card 
                  title={
                    <div className="flex items-center gap-2 sm:gap-3">
                      <SafetyCertificateOutlined className="text-base sm:text-lg" style={{ color: theme.accentColor || '#10b981' }} />
                      <span className="text-sm sm:text-base" style={{ color: theme.modalTextColor || '#111B21' }}>Account Info</span>
                    </div>
                  }
                  className="shadow-sm w-full"
                  bodyStyle={{ padding: '0' }}
                  style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}
                  headStyle={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF', borderBottom: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}
                >
                  {/* Email - Responsive */}
                  <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b transition-colors" style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                          <MailOutlined className="text-sm sm:text-lg" style={{ color: theme.avatarBackgroundColor || '#8b5cf6' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm" style={{ color: theme.sidebarTextColor || '#111B21' }}>Email</p>
                          <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Your account email</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium text-xs sm:text-sm truncate" style={{ color: theme.sidebarTextColor || '#111B21' }}>{user?.email}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <CheckCircleOutlined className="text-xs" style={{ color: theme.accentColor || '#52c41a' }} />
                          <span className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Verified</span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(user?.email, 'email')}
                        className="p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#E9EDEF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <CopyOutlined className={`text-xs sm:text-sm`} style={{ color: copied === 'email' ? theme.accentColor || '#52c41a' : theme.timestampColor || '#667781' }} />
                      </button>
                    </div>
                  </div>

                  {/* Phone - Responsive */}
                  <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b transition-colors" style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                          <PhoneOutlined className="text-sm sm:text-lg" style={{ color: theme.sendButtonColor || '#3b82f6' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm" style={{ color: theme.sidebarTextColor || '#111B21' }}>Phone</p>
                          <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Contact number</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium text-xs sm:text-sm" style={{ color: theme.sidebarTextColor || '#111B21' }}>{phone ? formatPhoneNumber(phone) : 'Not provided'}</p>
                        {phone && (
                          <span className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Verified</span>
                        )}
                      </div>
                      {phone && (
                        <button
                          onClick={() => copyToClipboard(phone, 'phone')}
                          className="p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#E9EDEF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <CopyOutlined className={`text-xs sm:text-sm`} style={{ color: copied === 'phone' ? theme.accentColor || '#52c41a' : theme.timestampColor || '#667781' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Account Type - Responsive */}
                  <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                          <LockOutlined className="text-sm sm:text-lg" style={{ color: theme.errorColor || '#ff7a45' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm" style={{ color: theme.sidebarTextColor || '#111B21' }}>Account Type</p>
                          <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Your role</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge 
                          color={user?.role === 'admin' ? theme.errorColor || '#ff7a45' : theme.accentColor || '#52c41a'} 
                          text={<span className="font-semibold text-xs sm:text-sm capitalize" style={{ color: theme.sidebarTextColor || '#111B21' }}>{user?.role?.replace('_', ' ') || 'User'}</span>}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar - Quick Stats - Fully Responsive */}
              <div className="space-y-4 sm:space-y-6 w-full">
                {/* Member Since Card - Responsive */}
                <Card className="shadow-sm w-full" bodyStyle={{ padding: windowWidth < 640 ? '12px' : '16px' }} style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                      <CalendarOutlined className="text-sm sm:text-lg" style={{ color: theme.avatarBackgroundColor || '#6366f1' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium" style={{ color: theme.timestampColor || '#667781' }}>Member Since</p>
                      <p className="text-base sm:text-lg font-bold mt-0.5 sm:mt-1" style={{ color: theme.sidebarTextColor || '#111B21' }}>{memberSince}</p>
                    </div>
                  </div>
                </Card>

                {/* Account Status Card - Responsive */}
                <Card className="shadow-sm w-full" bodyStyle={{ padding: windowWidth < 640 ? '12px' : '16px' }} style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium" style={{ color: theme.timestampColor || '#667781' }}>Status</p>
                      <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accentColor || '#52c41a' }}></div>
                        <p className="font-semibold text-xs sm:text-sm" style={{ color: theme.sidebarTextColor || '#111B21' }}>Active</p>
                      </div>
                    </div>
                    <EyeOutlined className="text-xl sm:text-2xl opacity-20" style={{ color: theme.accentColor || '#52c41a' }} />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Edit Phone Section - Fully Responsive */}
          {editing && (
            <Card className="shadow-sm mb-6 w-full" style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: theme.modalTextColor || '#111B21' }}>
                    Phone Number
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (234) 567-8900"
                    size={windowWidth < 640 ? 'middle' : 'large'}
                    prefix={<PhoneOutlined style={{ color: theme.timestampColor || '#667781' }} />}
                    status={phone && !isPhoneValid(phone) ? 'error' : ''}
                    className="rounded-lg text-xs sm:text-sm"
                    style={{
                      backgroundColor: theme.inputBackgroundColor || '#F8F9FA',
                      color: theme.inputTextColor || '#111B21',
                      borderColor: theme.sidebarBorderColor || '#E9EDEF',
                    }}
                  />
                  {phone && !isPhoneValid(phone) && (
                    <p className="text-xs mt-1.5 sm:mt-2 flex items-center gap-1" style={{ color: theme.errorColor || '#ff4d4f' }}>
                      <InfoCircleOutlined />
                      Please enter a valid phone number
                    </p>
                  )}
                  <p className="text-xs mt-1.5 sm:mt-2" style={{ color: theme.timestampColor || '#667781' }}>
                    Enter a valid international phone number (optional)
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Action Buttons - Fully Responsive */}
      {editing && windowWidth < 768 && (
        <div className="fixed bottom-0 left-0 right-0 border-t shadow-2xl sm:hidden" style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF', borderColor: theme.sidebarBorderColor || '#E9EDEF' }}>
          <div className="px-3 py-3 space-y-2 sm:space-y-3">
            <Button
              size={windowWidth < 640 ? 'middle' : 'large'}
              onClick={handleCancel}
              className="w-full"
              style={{
                borderColor: theme.sidebarBorderColor || '#E9EDEF',
                color: theme.sidebarTextColor || '#111B21',
                backgroundColor: theme.modalBackgroundColor || '#FFFFFF',
                height: windowWidth < 640 ? '40px' : '48px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: windowWidth < 640 ? '13px' : '14px',
              }}
            >
              <CloseOutlined />
              Cancel
            </Button>
            <Button
              type="primary"
              size={windowWidth < 640 ? 'middle' : 'large'}
              icon={saving ? <LoadingOutlined /> : <SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!name.trim() || (phone && !isPhoneValid(phone))}
              className="w-full"
              style={{
                backgroundColor: theme.sendButtonColor || '#008069',
                borderColor: theme.sendButtonColor || '#008069',
                color: theme.sendButtonIconColor || '#FFFFFF',
                height: windowWidth < 640 ? '40px' : '48px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: windowWidth < 640 ? '13px' : '14px',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Remove Avatar Modal - Responsive */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CameraOutlined className="text-base sm:text-lg" style={{ color: theme.errorColor || '#ff4d4f' }} />
            <span className="text-sm sm:text-base" style={{ color: theme.modalTextColor || '#111B21' }}>Remove Photo</span>
          </div>
        }
        open={showRemoveAvatar}
        onCancel={() => setShowRemoveAvatar(false)}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => setShowRemoveAvatar(false)} 
            size={windowWidth < 640 ? 'middle' : 'large'}
            style={{
              borderColor: theme.sidebarBorderColor || '#E9EDEF',
              color: theme.modalTextColor || '#111B21',
            }}
          >
            Keep Photo
          </Button>,
          <Button
            key="remove"
            type="primary"
            danger
            onClick={handleRemoveAvatar}
            size={windowWidth < 640 ? 'middle' : 'large'}
            style={{
              backgroundColor: theme.errorColor || '#ff4d4f',
              borderColor: theme.errorColor || '#ff4d4f',
            }}
          >
            Remove Photo
          </Button>,
        ]}
        centered
        width={windowWidth < 640 ? 320 : 360}
        styles={{
          content: { backgroundColor: theme.modalBackgroundColor || '#FFFFFF' },
          header: { backgroundColor: theme.modalBackgroundColor || '#FFFFFF', borderBottom: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }
        }}
      >
        <div className="text-center py-3 sm:py-4">
          <p className="text-sm sm:text-base" style={{ color: theme.modalTextColor || '#111B21' }}>Remove your profile photo?</p>
          <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: theme.timestampColor || '#667781' }}>You can upload a new one anytime.</p>
        </div>
      </Modal>
    </div>
  );
}