import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Avatar, Drawer } from 'antd';
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { getMenuItems } from '../../routes/pageData';
import { useTheme } from '../../hooks/useTheme';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeRoomId = useSelector((s) => s.chat?.activeRoomId || '');

  const isInChat = location.pathname.includes('/chat') || location.pathname.includes('/user');
  const isInActiveChat = isInChat && activeRoomId && activeRoomId !== '';
  const menuItems = getMenuItems(user?.role, navigate);
  const activeKey = location.pathname;

  // Check if current path matches menu item path
  const isMenuItemActive = (itemPath) => {
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  };




  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION - WhatsApp Style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] shadow-[0_-1px_3px_rgba(0,0,0,0.08)]" style={{ backgroundColor: theme?.backgroundColor || '#F0F2F5' }}>
        <div className="flex items-center justify-around h-14 px-1">
          {menuItems.slice(0, 3).map((item) => {
            const isActive = isMenuItemActive(item.path);
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative"
              >
                <div className="flex items-center justify-center w-12 h-8 rounded-full transition-all" style={{ backgroundColor: isActive ? (theme?.secondaryColor || '#D1F4E0') : 'transparent' }}>
                  <span style={{ fontSize: '24px', color: isActive ? (theme?.primaryColor || '#00A884') : (theme?.sidebarTextColor || '#667781') }}>{item.icon}</span>
                </div>
                <span style={{
                  fontSize: '10px',
                  color: isActive ? (theme?.primaryColor || '#00A884') : (theme?.sidebarTextColor || '#667781'),
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.2px'
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all"
          >
            <div className="flex items-center justify-center w-12 h-8 rounded-full">
              <MenuOutlined style={{ fontSize: '24px', color: theme?.sidebarTextColor || '#667781' }} />
            </div>
            <span style={{ fontSize: '10px', color: theme?.sidebarTextColor || '#667781', fontWeight: 400, letterSpacing: '0.2px' }}>More</span>
          </button>
        </div>
      </nav>

      {/* DRAWER - WhatsApp Style */}
      <Drawer
        title={null}
        placement="bottom"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        bodyStyle={{ padding: 0, borderRadius: '16px 16px 0 0' }}
        height="auto"
        headerStyle={{ display: 'none' }}
        closeIcon={null}
      >
        <div className="flex flex-col bg-white" style={{ borderRadius: '16px 16px 0 0' }}>
          <div className="flex items-center justify-center py-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <div style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }} className="px-4 py-3 flex items-center gap-3 border-b border-gray-200">
            <Avatar size={48} src={user?.avatar} icon={<UserOutlined />} style={{ backgroundColor: theme?.primaryColor || '#00A884' }} />
            <div>
              <p className="text-gray-900 font-medium text-base">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.role === 'USER' ? user?.email : user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <nav className="py-2">
            {menuItems.map((item) => {
              const isActive = isMenuItemActive(item.path);
              return (
                <button
                  key={item.key}
                  onClick={() => { item.onClick(); setDrawerOpen(false); }}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
                  style={{ backgroundColor: isActive ? (theme?.secondaryColor || '#E7F8F0') : 'transparent' }}
                >
                  <span style={{ fontSize: '22px', color: isActive ? (theme?.primaryColor || '#00A884') : (theme?.sidebarTextColor || '#667781') }}>{item.icon}</span>
                  <span style={{ fontSize: '16px', color: isActive ? (theme?.primaryColor || '#00A884') : '#111827', fontWeight: isActive ? 500 : 400 }}>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4 space-y-2">
            <button onClick={() => { navigate('/profile'); setDrawerOpen(false); }} className="w-full py-3 rounded-lg text-white font-medium transition-colors" style={{ backgroundColor: theme?.primaryColor || '#00A884' }}>
              View Profile
            </button>
            <button onClick={() => { logout(); setDrawerOpen(false); navigate('/login'); }} className="w-full py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors active:bg-gray-100">
              Logout
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}