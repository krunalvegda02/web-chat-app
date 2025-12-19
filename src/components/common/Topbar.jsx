
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Avatar, Badge } from 'antd';
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const getPageTitle = () => {
    if (location.pathname.includes('admin')) return 'Admin Dashboard';
    if (location.pathname.includes('super-admin')) return 'Super Admin Dashboard';
    if (location.pathname.includes('chat')) return 'Messages';
    if (location.pathname.includes('profile')) return 'Profile';
    if (location.pathname.includes('settings')) return 'Settings';
    return 'Dashboard';
  };

  const userMenu = [
    {
      key: 'profile',
      label: 'My Profile',
      icon: <UserOutlined style={{ fontSize: '14px' }} />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      label: 'Account Settings',
      icon: <SettingOutlined style={{ fontSize: '14px' }} />,
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'help',
      label: 'Help & Support',
      icon: <QuestionCircleOutlined style={{ fontSize: '14px' }} />,
      onClick: () => navigate('/help'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined style={{ fontSize: '14px' }} />,
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const notifications = [
    {
      key: '1',
      label: (
        <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg w-64 md:w-80">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex-shrink-0 flex items-center justify-center">
            <BellOutlined className="text-white text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">New message</p>
            <p className="text-xs text-gray-500">2 min ago</p>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg w-64 md:w-80">
          <div className="w-10 h-10 rounded-lg bg-green-500 flex-shrink-0 flex items-center justify-center">
            <UserOutlined className="text-white text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">New user joined</p>
            <p className="text-xs text-gray-500">1 hr ago</p>
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'viewall',
      label: (
        <p
          className="text-center text-green-600 font-medium cursor-pointer py-2 hover:text-green-700 text-sm"
          onClick={() => navigate('/notifications')}
        >
          View All
        </p>
      ),
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between h-full px-3 md:px-6 gap-3 md:gap-4" style={{ marginLeft: '64px', marginLeft: 'calc(64px)' }}>
        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* NOTIFICATIONS */}
          <Dropdown menu={{ items: notifications }} trigger={['click']} placement="bottomRight">
            <Badge count={3} size="small" className="cursor-pointer">
              <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <BellOutlined className="text-base" />
              </button>
            </Badge>
          </Dropdown>

          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* USER MENU */}
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {user?.name}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>

              <Avatar
                size={36}
                src={user?.avatar}
                icon={<UserOutlined />}
                className="border-2 border-gray-200 flex-shrink-0"
                style={{
                  backgroundColor: '#10B981',
                }}
              />
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}