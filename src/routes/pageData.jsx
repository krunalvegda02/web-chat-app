import {
  MessageOutlined,
  BgColorsOutlined,
  UsergroupAddOutlined,
  AreaChartOutlined,
  SettingOutlined,
  DashboardOutlined,
} from '@ant-design/icons';

export const getMenuItems = (role, navigate) => {
  const menuConfig = {
    ADMIN: [
      { key: '/admin', icon: <MessageOutlined className='text-[25px]' />, label: 'Messages', path: '/admin' },
      { key: '/admin/theme', icon: <BgColorsOutlined className='text-[25px]' />, label: 'Appearance', path: '/admin/theme' },
      { key: '/admin/users', icon: <UsergroupAddOutlined className='text-[25px]' />, label: 'Users', path: '/admin/users' },
      { key: '/admin/analytics', icon: <AreaChartOutlined className='text-[25px]' />, label: 'Analytics', path: '/admin/analytics' },
      { key: '/admin/settings', icon: <SettingOutlined className='text-[25px]' />, label: 'Settings', path: '/admin/settings' },
    ],
    SUPER_ADMIN: [
      { key: '/super-admin', icon: <DashboardOutlined className='text-[25px]' />, label: 'Dashboard', path: '/super-admin' },
      { key: '/super-admin/admins', icon: <UsergroupAddOutlined className='text-[25px]' />, label: 'Admins', path: '/super-admin/admins' },
      { key: '/super-admin/chat', icon: <MessageOutlined className='text-[25px]' />, label: 'Messages', path: '/super-admin/chat' },
      { key: '/super-admin/admin-chats', icon: <MessageOutlined className='text-[25px]' />, label: 'Messages', path: '/super-admin/admin-chats' },
      { key: '/super-admin/analytics', icon: <AreaChartOutlined className='text-[25px]' />, label: 'Analytics', path: '/super-admin/analytics' },
      { key: '/super-admin/settings', icon: <SettingOutlined className='text-[25px]' />, label: 'Settings', path: '/super-admin/settings' },
    ],
  };

  return menuConfig[role]?.map(item => ({
    ...item,
    onClick: () => navigate(item.path),
  })) || [];
};
