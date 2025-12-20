
import { useRef, useState } from 'react';
import { Avatar, Tooltip, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMenuItems } from '../../routes/pageData';

export default function Sidebar() {
  const { user, logout } = useAuth();
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

  return (
    <aside ref={sidebarRef} className="hidden sm:block fixed left-0 top-0 bottom-0 z-40 w-20 bg-[#F0F2F5] border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* <div className="py-4 flex items-center justify-center border-b border-gray-200">
          <button onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/super-admin')} className="w-12 h-12 rounded-full bg-[#008069] text-white font-bold text-xl hover:bg-[#006d5b] transition-colors shadow-md">
            C
          </button>
        </div> */}
        <nav className="flex-1 flex flex-col items-center gap-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeKey === item.path;
            return (
              <Tooltip key={item.key} title={item.label} placement="right">
                <button onClick={item.onClick} className="w-14 h-14 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: isActive ? '#FFFFFF' : 'transparent', color: isActive ? '#008069' : '#667781' }}>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                </button>
              </Tooltip>
            );
          })}
        </nav>
        <div className="py-4 flex flex-col items-center gap-3 border-t border-gray-200">
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="rightBottom">
            <button className="hover:scale-105 transition-transform">
              <Avatar size={44} src={user?.avatar} icon={<UserOutlined />} style={{ backgroundColor: '#25D366' }} className="shadow-md" />
            </button>
          </Dropdown>
        </div>
      </div>
    </aside>
  );
}