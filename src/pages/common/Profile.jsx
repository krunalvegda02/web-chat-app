import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import clsx from "clsx"
import { useTheme } from '../../hooks/useTheme';
import {
  Input, Button, message as antMessage, Divider, Spin, Modal, Tooltip,
  Card, Segmented, Space, Badge, Progress, Statistic, Empty, Collapse, Form, Alert, Steps
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
  UploadOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import { updateProfile, changePassword } from '../../redux/slices/authSlice';
import { updateProfileWithAvatar } from '../../redux/slices/userSlice';
import { getApiKey } from '../../redux/slices/platformSlice.jsx';
import { copyToClipboardWithMessage } from '../../utils/clipboardUtils';

export default function Profile() {
  const { theme } = useTheme();
  const { user } = useSelector((s) => s.auth);
  const { platformApiKey } = useSelector((s) => s.platform);
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

  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Change password modal state
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState(null);
  const [changePasswordForm] = Form.useForm();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openChangePasswordModal = () => {
    changePasswordForm.resetFields();
    setChangePasswordError(null);
    setChangePasswordModalOpen(true);
  };

  const closeChangePasswordModal = () => {
    setChangePasswordModalOpen(false);
    setChangePasswordError(null);
    changePasswordForm.resetFields();
  };

  const handleChangePassword = async (values) => {
    try {
      setChangePasswordLoading(true);
      setChangePasswordError(null);
      await dispatch(changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      })).unwrap();
      antMessage.success('Password changed successfully!');
      closeChangePasswordModal();
    } catch (err) {
      setChangePasswordError(err || 'Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const validatePasswordStrength = (_, value) => {
    if (!value) return Promise.reject(new Error('Password is required'));
    if (value.length < 8) return Promise.reject(new Error('At least 8 characters'));
    if (!/[A-Z]/.test(value)) return Promise.reject(new Error('Include an uppercase letter'));
    if (!/[a-z]/.test(value)) return Promise.reject(new Error('Include a lowercase letter'));
    if (!/[0-9]/.test(value)) return Promise.reject(new Error('Include a number'));
    if (!/[!@#$%^&*]/.test(value)) return Promise.reject(new Error('Include a special character (!@#$%^&*)'));
    return Promise.resolve();
  };

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

    setSaving(true);
    try {
      const result = await dispatch(updateProfile({
        name: name.trim(),
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

  const copyToClipboard = async (text, type) => {
    const success = await copyToClipboardWithMessage(
      text,
      antMessage,
      'Copied to clipboard',
      'Failed to copy to clipboard'
    );

    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const loadApiKey = async () => {
    if (!user?.platformId) return;
    setApiKeyLoading(true);
    try {
      await dispatch(getApiKey(user.platformId.toString()));
    } finally {
      setApiKeyLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'PLATFORM_ADMIN' && user?.platformId) {
      loadApiKey();
    }
  }, [user?.platformId]);

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
    <div className={clsx('fixed', 'top-0', 'right-0', 'bottom-0', 'sm:left-20', 'left-0', 'flex', 'flex-col', 'w-full')} style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
      {/* Premium Header - Fully Responsive */}
      <div
        className={`${getHeaderPadding()} flex items-center justify-between shadow-md sticky top-0 z-40 w-full`}
        style={{ backgroundColor: theme.sidebarHeaderColor || '#008069' }}
      >
        <div className={clsx('flex', 'items-center', 'gap-2', 'sm:gap-3', 'flex-1', 'min-w-0')}>
          <button
            onClick={() => navigate(-1)}
            className={clsx('p-1', 'sm:p-2', 'hover:bg-white/20', 'rounded-full', 'transition-colors', 'flex-shrink-0')}
          >
            <ArrowLeftOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: windowWidth < 640 ? '18px' : '20px' }} />
          </button>
          <h1 className={`${getHeaderTextSize()} sm:text-lg font-medium truncate`} style={{ color: theme.headerTextColor || '#FFFFFF' }}>Profile</h1>
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className={clsx('p-1.5', 'sm:p-2', 'hover:bg-white/20', 'rounded-full', 'transition-colors', 'flex-shrink-0')}
          >
            <EditOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: windowWidth < 640 ? '18px' : '20px' }} />
          </button>
        ) : (
          <div className={clsx('flex', 'items-center', 'gap-1', 'sm:gap-2', 'flex-shrink-0')}>
            <button
              onClick={handleCancel}
              className={clsx('p-1.5', 'sm:p-2', 'hover:bg-white/20', 'rounded-full', 'transition-colors')}
            >
              <CloseOutlined style={{ color: theme.headerTextColor || '#FFFFFF', fontSize: windowWidth < 640 ? '18px' : '20px' }} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className={clsx('p-1.5', 'sm:p-2', 'hover:bg-white/20', 'rounded-full', 'transition-colors', 'disabled:opacity-50')}
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
      <div className={clsx('flex-1', 'overflow-y-auto', 'w-full', 'pb-32', 'sm:pb-20', 'md:pb-0')} style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
        <div className={clsx('w-full', 'max-w-6xl', 'mx-auto', 'px-3', 'sm:px-4', 'md:px-6', 'py-3', 'sm:py-4', 'md:py-6')}>

          {/* Profile Card - Fully Responsive */}
          <div className={clsx('mb-4', 'sm:mb-6')}>
            <Card
              className={clsx('shadow-sm', 'w-full')}
              bodyStyle={{ padding: 0 }}
              bordered={false}
              style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}
            >
              <div className={clsx('p-3', 'sm:p-4', 'md:p-6')} style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF', color: theme.modalTextColor || '#111B21' }}>
                <div className={clsx('flex', 'flex-col', 'sm:flex-row', 'sm:items-start', 'gap-3', 'sm:gap-4', 'md:gap-6')}>
                  {/* Avatar Section - Responsive */}
                  <div className={clsx('relative', 'group', 'flex-shrink-0', 'w-full', 'sm:w-auto', 'flex', 'sm:flex-col', 'justify-center', 'sm:justify-start')}>
                    <Avatar
                      src={avatar}
                      name={name}
                      size={getAvatarSize()}
                      style={{ backgroundColor: theme.avatarBackgroundColor || '#008069' }}
                    />
                    {editing && (
                      <>
                        <div
                          className={clsx('absolute', 'inset-0', 'rounded-full', 'flex', 'items-center', 'justify-center', 'cursor-pointer', 'transition-all', 'duration-300', 'opacity-0', 'group-hover:opacity-100', 'bg-black/60')}
                          onClick={() => fileInputRef.current?.click()}
                          style={{ width: getAvatarSize(), height: getAvatarSize() }}
                        >
                          <div className="text-center">
                            {uploading ? (
                              <Spin indicator={<LoadingOutlined className={clsx('text-white', 'text-2xl', 'sm:text-3xl')} spin />} />
                            ) : (
                              <>
                                <CameraFilled className={clsx('text-2xl', 'sm:text-3xl', 'text-white', 'mb-1', 'sm:mb-2')} />
                                <p className={clsx('text-white', 'text-xs', 'font-semibold')}>Update</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Add/Change Button - Responsive */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={clsx('absolute', '-bottom-2', '-right-2', 'px-2', 'sm:px-2.5', 'py-1', 'sm:py-1.5', 'text-white', 'text-xs', 'font-semibold', 'rounded-full', 'shadow-lg', 'hover:opacity-90', 'transition-all', 'duration-200', 'hover:scale-105', 'active:scale-95', 'flex', 'items-center', 'gap-0.5', 'sm:gap-1')}
                          style={{ backgroundColor: theme.sendButtonColor || '#008069' }}
                        >
                          <UploadOutlined className="text-xs" />
                          <span className={clsx('hidden', 'sm:inline')}>{avatar ? 'Change' : 'Add'}</span>
                          <span className="sm:hidden">{avatar ? 'Edit' : '+'}</span>
                        </button>
                      </>
                    )}

                    {/* Remove Avatar Button - Responsive */}
                    {editing && avatar && (
                      <Tooltip title="Remove photo">
                        <button
                          onClick={() => setShowRemoveAvatar(true)}
                          className={clsx('absolute', '-top-1', '-right-1', 'w-6', 'h-6', 'sm:w-7', 'sm:h-7', 'rounded-full', 'flex', 'items-center', 'justify-center', 'shadow-lg', 'transition-all', 'duration-200', 'hover:scale-110', 'active:scale-95', 'text-base', 'sm:text-lg', 'leading-none')}
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
                  <div className={clsx('flex-1', 'min-w-0', 'w-full', 'sm:w-auto')}>
                    {!editing ? (
                      <div className={clsx('space-y-2', 'sm:space-y-3')}>
                        {/* Mobile: Name and Status in Row */}
                        <div className={clsx('flex', 'sm:block', 'items-center', 'justify-between', 'gap-2')}>
                          <div className={clsx('flex-1', 'min-w-0')}>
                            <h2 className={clsx('text-xl', 'sm:text-2xl', 'md:text-4xl', 'font-bold', 'truncate')} style={{ color: theme.sidebarTextColor || '#111B21' }}>{name}</h2>
                          </div>
                          <div className={clsx('sm:hidden', 'flex-shrink-0')}>
                            <Badge
                              icon={<GlobalOutlined />}
                              color={user?.status === 'ACTIVE' ? 'success' : 'default'}
                              text={<span className={clsx('text-xs', 'font-medium')}>{user?.status || 'Active'}</span>}
                            />
                          </div>
                        </div>

                        {/* {bio && (
                          <p className={clsx('text-xs', 'sm:text-sm', 'md:text-base', 'leading-relaxed', 'max-w-xl', 'break-words')} style={{ color: theme.sidebarTextColor || '#111B21' }}>
                            {bio}
                          </p>
                        )} */}

                        {/* Desktop: Badges */}
                        <div className={clsx('hidden', 'sm:flex', 'flex-wrap', 'gap-1', 'sm:gap-2', 'pt-1', 'sm:pt-2')}>
                          {user?.phoneVerified && (
                            <Badge
                              icon={<CheckCircleOutlined />}
                              color="success"
                              text={<span className={clsx('text-xs', 'font-medium')}>Phone Verified</span>}
                            />
                          )}
                          <Badge
                            icon={<GlobalOutlined />}
                            color={user?.status === 'ACTIVE' ? 'success' : 'default'}
                            text={<span className={clsx('text-xs', 'font-medium')}>{user?.status || 'Active'}</span>}
                          />
                        </div>

                        {/* Mobile: Phone Verified Badge Only */}
                        {user?.phoneVerified && (
                          <div className={clsx('sm:hidden', 'flex', 'pt-1')}>
                            <Badge
                              icon={<CheckCircleOutlined />}
                              color="success"
                              text={<span className={clsx('text-xs', 'font-medium')}>Phone Verified</span>}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={clsx('space-y-3', 'sm:space-y-4', 'w-full')}>
                        <div>
                          <label className={clsx('block', 'text-xs', 'sm:text-sm', 'font-semibold', 'mb-1.5', 'sm:mb-2')} style={{ color: theme.modalTextColor || '#111B21' }}>
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
                            className={clsx('rounded-lg', 'text-xs', 'sm:text-sm')}
                            style={{
                              backgroundColor: theme.inputBackgroundColor || '#F8F9FA',
                              color: theme.inputTextColor || '#111B21',
                              borderColor: theme.sidebarBorderColor || '#E9EDEF',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>



          {/* Account Information Section - Fully Responsive */}
          <div className={clsx('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-4', 'sm:gap-6', 'mb-6')}>

            {/* Main Info Card - Fully Responsive */}
            <div className={clsx('lg:col-span-2', 'w-full')}>
              <Card
                title={
                  <div className={clsx('flex', 'items-center', 'gap-2', 'sm:gap-3')}>
                    <SafetyCertificateOutlined className={clsx('text-base', 'sm:text-lg')} style={{ color: theme.accentColor || '#10b981' }} />
                    <span className={clsx('text-sm', 'sm:text-base')} style={{ color: theme.modalTextColor || '#111B21' }}>Account Info</span>
                  </div>
                }
                className={clsx('shadow-sm', 'w-full')}
                bodyStyle={{ padding: '0' }}
                style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}
                headStyle={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF', borderBottom: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}
              >
                {/* Email - Responsive */}
                <div className={clsx('px-3', 'sm:px-4', 'md:px-6', 'py-3', 'sm:py-4', 'border-b', 'transition-colors')} style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className={clsx('flex', 'items-center', 'justify-between', 'gap-2', 'sm:gap-4', 'flex-wrap', 'sm:flex-nowrap')}>
                    <div className={clsx('flex', 'items-center', 'gap-2', 'sm:gap-3', 'flex-1', 'min-w-0')}>
                      <div className={clsx('w-8', 'h-8', 'sm:w-10', 'sm:h-10', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'flex-shrink-0')} style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                        <MailOutlined className={clsx('text-sm', 'sm:text-lg')} style={{ color: theme.avatarBackgroundColor || '#8b5cf6' }} />
                      </div>
                      <div className={clsx('flex-1', 'min-w-0')}>
                        <p className={clsx('font-semibold', 'text-xs', 'sm:text-sm')} style={{ color: theme.sidebarTextColor || '#111B21' }}>Email</p>
                        <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Your account email</p>
                      </div>
                    </div>
                    <div className={clsx('text-right', 'flex-shrink-0')}>
                      <p className={clsx('font-medium', 'text-xs', 'sm:text-sm', 'truncate')} style={{ color: theme.sidebarTextColor || '#111B21' }}>{user?.email}</p>
                      <div className={clsx('flex', 'items-center', 'gap-1', 'justify-end')}>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(user?.email, 'email')}
                      className={clsx('p-1.5', 'sm:p-2', 'rounded-lg', 'transition-colors', 'flex-shrink-0')}
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#E9EDEF'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <CopyOutlined className={`text-xs sm:text-sm`} style={{ color: copied === 'email' ? theme.accentColor || '#52c41a' : theme.timestampColor || '#667781' }} />
                    </button>
                  </div>
                </div>

                {/* Phone - Responsive */}
                <div className={clsx('px-3', 'sm:px-4', 'md:px-6', 'py-3', 'sm:py-4', 'border-b', 'transition-colors')} style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className={clsx('flex', 'items-center', 'justify-between', 'gap-2', 'sm:gap-4', 'flex-wrap', 'sm:flex-nowrap')}>
                    <div className={clsx('flex', 'items-center', 'gap-2', 'sm:gap-3', 'flex-1', 'min-w-0')}>
                      <div className={clsx('w-8', 'h-8', 'sm:w-10', 'sm:h-10', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'flex-shrink-0')} style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                        <PhoneOutlined className={clsx('text-sm', 'sm:text-lg')} style={{ color: theme.sendButtonColor || '#3b82f6' }} />
                      </div>
                      <div className={clsx('flex-1', 'min-w-0')}>
                        <p className={clsx('font-semibold', 'text-xs', 'sm:text-sm')} style={{ color: theme.sidebarTextColor || '#111B21' }}>Phone</p>
                        <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Contact number</p>
                      </div>
                    </div>
                    <div className={clsx('text-right', 'flex-shrink-0')}>
                      <p className={clsx('font-medium', 'text-xs', 'sm:text-sm')} style={{ color: theme.sidebarTextColor || '#111B21' }}>{user?.phone ? formatPhoneNumber(user.phone) : 'Not provided'}</p>
                    </div>
                    {user?.phone && (
                      <button
                        onClick={() => copyToClipboard(user.phone, 'phone')}
                        className={clsx('p-1.5', 'sm:p-2', 'rounded-lg', 'transition-colors', 'flex-shrink-0')}
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#E9EDEF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <CopyOutlined className={clsx('text-xs', 'sm:text-sm')} style={{ color: copied === 'phone' ? theme.accentColor || '#52c41a' : theme.timestampColor || '#667781' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Type - Responsive */}
                <div className={clsx('px-3', 'sm:px-4', 'md:px-6', 'py-3', 'sm:py-4', 'border-b', 'transition-colors')} style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className={clsx('flex', 'items-center', 'justify-between', 'gap-2', 'sm:gap-4')}>
                    <div className={clsx('flex', 'items-center', 'gap-2', 'sm:gap-3', 'flex-1')}>
                      <div className={clsx('w-8', 'h-8', 'sm:w-10', 'sm:h-10', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'flex-shrink-0')} style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                        <LockOutlined className={clsx('text-sm', 'sm:text-lg')} style={{ color: theme.errorColor || '#ff7a45' }} />
                      </div>
                      <div className={clsx('flex-1', 'min-w-0')}>
                        <p className={clsx('font-semibold', 'text-xs', 'sm:text-sm')} style={{ color: theme.sidebarTextColor || '#111B21' }}>Account Type</p>
                        <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Your role</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge
                        color={user?.role === 'admin' ? theme.errorColor || '#ff7a45' : theme.accentColor || '#52c41a'}
                        text={<span className={clsx('font-semibold', 'text-xs', 'sm:text-sm', 'capitalize')} style={{ color: theme.sidebarTextColor || '#111B21' }}>{user?.role?.replace('_', ' ') || 'User'}</span>}
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Password Row */}
                <div className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 transition-colors${user?.role === 'PLATFORM_ADMIN' ? ' border-b' : ''}`} style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className={clsx('flex', 'items-center', 'justify-between', 'gap-2', 'sm:gap-4')}>
                    <div className={clsx('flex', 'items-center', 'gap-2', 'sm:gap-3', 'flex-1')}>
                      <div className={clsx('w-8', 'h-8', 'sm:w-10', 'sm:h-10', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'flex-shrink-0')} style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                        <KeyOutlined className={clsx('text-sm', 'sm:text-lg')} style={{ color: theme.sendButtonColor || '#3b82f6' }} />
                      </div>
                      <div className={clsx('flex-1', 'min-w-0')}>
                        <p className={clsx('font-semibold', 'text-xs', 'sm:text-sm')} style={{ color: theme.sidebarTextColor || '#111B21' }}>Password</p>
                        <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Change your password</p>
                      </div>
                    </div>
                    <Button
                      size="small"
                      icon={<KeyOutlined />}
                      onClick={openChangePasswordModal}
                      style={{
                        borderColor: theme.sidebarHeaderColor || '#008069',
                        color: theme.sidebarHeaderColor || '#008069',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                {/* API Key Row - Platform Admin only */}
                {user?.role === 'PLATFORM_ADMIN' && (
                  <div className={clsx('px-3', 'sm:px-4', 'md:px-6', 'py-3', 'sm:py-4', 'transition-colors')} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.sidebarHoverColor || '#F5F6F6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div className={clsx('flex', 'flex-col', 'gap-2')}>
                      <div className={clsx('flex', 'items-center', 'justify-between', 'gap-2', 'sm:gap-4')}>
                        <div className={clsx('flex', 'items-center', 'gap-2', 'sm:gap-3', 'flex-1')}>
                          <div className={clsx('w-8', 'h-8', 'sm:w-10', 'sm:h-10', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'flex-shrink-0')} style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5' }}>
                            <SafetyCertificateOutlined className={clsx('text-sm', 'sm:text-lg')} style={{ color: '#f59e0b' }} />
                          </div>
                          <div className={clsx('flex-1', 'min-w-0')}>
                            <p className={clsx('font-semibold', 'text-xs', 'sm:text-sm')} style={{ color: theme.sidebarTextColor || '#111B21' }}>API Key</p>
                            <p className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>Platform integration key</p>
                          </div>
                        </div>
                        <Button
                          size="small"
                          icon={apiKeyVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          loading={apiKeyLoading}
                          onClick={() => setApiKeyVisible((v) => !v)}
                          style={{ borderColor: '#f59e0b', color: '#f59e0b', borderRadius: '6px', fontSize: '12px' }}
                        >
                          {apiKeyVisible ? 'Hide' : 'Show'}
                        </Button>
                      </div>
                      {apiKeyVisible && (
                        <div
                          className={clsx('flex', 'items-center', 'gap-2', 'p-2', 'rounded-lg')}
                          style={{ backgroundColor: theme.inputBackgroundColor || '#F0F2F5', border: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` }}
                        >
                          {platformApiKey && platformApiKey !== 'legacy' ? (
                            <>
                              <code className={clsx('flex-1', 'text-xs', 'break-all', 'select-all')} style={{ color: '#111B21', fontFamily: 'monospace' }}>
                                {platformApiKey}
                              </code>
                              <Tooltip title={apiKeyCopied ? 'Copied!' : 'Copy'}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<CopyOutlined />}
                                  onClick={() => {
                                    navigator.clipboard.writeText(platformApiKey);
                                    setApiKeyCopied(true);
                                    antMessage.success('API key copied!');
                                    setTimeout(() => setApiKeyCopied(false), 2000);
                                  }}
                                  style={{ color: apiKeyCopied ? '#10B981' : '#f59e0b', flexShrink: 0 }}
                                />
                              </Tooltip>
                            </>
                          ) : platformApiKey === 'legacy' ? (
                            <span className={clsx('flex-1', 'text-xs')} style={{ color: '#f59e0b' }}>
                              ⚠️ Legacy key detected. Please regenerate from Super Admin panel to view it.
                            </span>
                          ) : (
                            <span className={clsx('flex-1', 'text-xs')} style={{ color: '#ef4444' }}>
                              No API key found. Contact your super admin.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar - Quick Stats - Fully Responsive */}
            <div className={clsx('space-y-4', 'sm:space-y-6', 'w-full')}>


              {/* Account Status Card - Responsive */}
              <Card className={clsx('shadow-sm', 'w-full')} bodyStyle={{ padding: windowWidth < 640 ? '12px' : '16px' }} style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF' }}>
                <div className={clsx('flex', 'items-center', 'justify-between')}>
                  <div>
                    <p className={clsx('text-xs', 'font-medium')} style={{ color: theme.timestampColor || '#667781' }}>Status</p>
                    <div className={clsx('flex', 'items-center', 'gap-2', 'mt-1.5', 'sm:mt-2')}>
                      <div
                        className={clsx('w-2', 'h-2', 'rounded-full')}
                        style={{
                          backgroundColor: user?.status === 'ACTIVE' ? theme.accentColor || '#52c41a' : theme.timestampColor || '#999',
                          animation: user?.status === 'ACTIVE' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                        }}
                      ></div>
                      <p className={clsx('font-semibold', 'text-xs', 'sm:text-sm')} style={{ color: theme.sidebarTextColor || '#111B21' }}>{user?.status || 'Active'}</p>
                    </div>
                  </div>
                  <EyeOutlined className={clsx('text-xl', 'sm:text-2xl', 'opacity-20')} style={{ color: user?.status === 'ACTIVE' ? theme.accentColor || '#52c41a' : theme.timestampColor }} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Buttons - Fully Responsive */}
      {editing && windowWidth < 768 && (
        <div className={clsx('fixed', 'bottom-0', 'left-0', 'right-0', 'border-t', 'shadow-2xl', 'sm:hidden')} style={{ backgroundColor: theme.modalBackgroundColor || '#FFFFFF', borderColor: theme.sidebarBorderColor || '#E9EDEF' }}>
          <div className={clsx('px-3', 'py-3', 'space-y-2', 'sm:space-y-3')}>
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
              disabled={!name.trim()}
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

      {/* Change Password Modal */}
      <Modal
        title={
          <div className={clsx('flex', 'items-center', 'gap-2')}>
            <KeyOutlined style={{ color: theme.sidebarHeaderColor || '#008069' }} />
            <span style={{ color: theme.modalTextColor || '#111B21' }}>Change Password</span>
          </div>
        }
        open={changePasswordModalOpen}
        onCancel={closeChangePasswordModal}
        footer={null}
        centered
        width={440}
        styles={{
          content: { backgroundColor: theme.modalBackgroundColor || '#FFFFFF' },
          header: { backgroundColor: theme.modalBackgroundColor || '#FFFFFF', borderBottom: `1px solid ${theme.sidebarBorderColor || '#E9EDEF'}` },
        }}
      >
        {changePasswordError && (
          <Alert message={changePasswordError} type="error" showIcon closable onClose={() => setChangePasswordError(null)} style={{ marginBottom: 16 }} />
        )}

        <Form form={changePasswordForm} layout="vertical" onFinish={handleChangePassword} autoComplete="off">
          <Form.Item
            name="oldPassword"
            rules={[{ required: true, message: 'Current password is required' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: theme.timestampColor || '#667781' }} />}
              placeholder="Current password"
              disabled={changePasswordLoading}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item name="newPassword" rules={[{ validator: validatePasswordStrength }]}>
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: theme.timestampColor || '#667781' }} />}
              placeholder="New password"
              disabled={changePasswordLoading}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: theme.timestampColor || '#667781' }} />}
              placeholder="Confirm new password"
              disabled={changePasswordLoading}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <p className={clsx('text-xs', 'mb-4')} style={{ color: theme.timestampColor || '#667781' }}>Min 8 chars · uppercase · lowercase · number · special char</p>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={changePasswordLoading}
            style={{ backgroundColor: theme.sidebarHeaderColor || '#008069', borderColor: theme.sidebarHeaderColor || '#008069', borderRadius: '8px' }}
          >
            Change Password
          </Button>
        </Form>
      </Modal>

      {/* Remove Avatar Modal - Responsive */}
      <Modal
        title={
          <div className={clsx('flex', 'items-center', 'gap-2')}>
            <CameraOutlined className={clsx('text-base', 'sm:text-lg')} style={{ color: theme.errorColor || '#ff4d4f' }} />
            <span className={clsx('text-sm', 'sm:text-base')} style={{ color: theme.modalTextColor || '#111B21' }}>Remove Photo</span>
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
        <div className={clsx('text-center', 'py-3', 'sm:py-4')}>
          <p className={clsx('text-sm', 'sm:text-base')} style={{ color: theme.modalTextColor || '#111B21' }}>Remove your profile photo?</p>
          <p className={clsx('text-xs', 'sm:text-sm', 'mt-1.5', 'sm:mt-2')} style={{ color: theme.timestampColor || '#667781' }}>You can upload a new one anytime.</p>
        </div>
      </Modal>
    </div>
  );
}