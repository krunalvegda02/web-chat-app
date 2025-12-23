
import { useRef } from 'react';
import { Avatar, Tooltip, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getMenuItems } from '../../routes/pageData';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const menuItems = getMenuItems(user?.role, navigate);
  const activeKey = location.pathname;

  const userMenu = [
    {
      key: 'profile',
      label: 'My Profile',
      icon: <UserOutlined style={{ fontSize: '14px' }} />,
      onClick: () => navigate('/profile'),
    },
    // {
    //   key: 'settings',
    //   label: 'Account Settings',
    //   icon: <SettingOutlined style={{ fontSize: '14px' }} />,
    //   onClick: () => navigate('/settings'),
    // },
    // {
    //   type: 'divider',
    // },
    // {
    //   key: 'help',
    //   label: 'Help & Support',
    //   icon: <QuestionCircleOutlined style={{ fontSize: '14px' }} />,
    //   onClick: () => navigate('/help'),
    // },
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

  return (
    <aside ref={sidebarRef} className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-20 border-r" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5', borderColor: theme.sidebarBorderColor || '#E9EDEF' }}>
      <div className="flex flex-col h-full">
        <nav className="flex-1 flex flex-col items-center gap-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeKey === item.path;
            return (
              <Tooltip key={item.key} title={item.label} placement="right">
                <button onClick={item.onClick} className="w-14 h-14 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: isActive ? (theme.sidebarActiveColor || '#FFFFFF') : 'transparent', color: isActive ? (theme.bottomNavActiveColor || theme.primaryColor || '#008069') : (theme.sidebarTextColor || '#667781') }}>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                </button>
              </Tooltip>
            );
          })}
        </nav>
        <div className="py-4 flex flex-col items-center gap-3 border-t" style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }}>
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="rightBottom">
            <button className="hover:scale-105 transition-transform">
              <Avatar size={44} src={user?.avatar} icon={<UserOutlined />} style={{ backgroundColor: theme.avatarBackgroundColor || '#25D366' }} className="shadow-md" />
            </button>
          </Dropdown>
        </div>
      </div>
    </aside>
  );
}