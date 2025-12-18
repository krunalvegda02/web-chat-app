import {
  MessageOutlined,
  BgColorsOutlined,
  UsergroupAddOutlined,
  AreaChartOutlined,
  SettingOutlined,
  DashboardOutlined,
  PhoneFilled,
  PhoneOutlined,
  PhoneTwoTone,
  PinterestOutlined,
  UserOutlined,
  ProfileFilled,
  ProfileOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { FaPersonBooth, FaPhone, FaUserAlt, FaUserEdit } from 'react-icons/fa';

export const getMenuItems = (role, navigate) => {
  const menuConfig = {
    ADMIN: [
      { key: '/admin', icon: <MessageOutlined className='text-[25px]' />, label: 'Messages', path: '/admin' },
      { key: '/admin/theme', icon: <BgColorsOutlined className='text-[25px]' />, label: 'Appearance', path: '/admin/theme' },
      { key: '/admin/users', icon: <UsergroupAddOutlined className='text-[25px]' />, label: 'Users', path: '/admin/users' },
      { key: '/admin/user-chat', icon: <MessageOutlined className='text-[25px]' />, label: 'Users', path: '/admin/user-chat' },
    ],
    SUPER_ADMIN: [
      { key: '/super-admin', icon: <DashboardOutlined className='text-[25px]' />, label: 'Dashboard', path: '/super-admin' },
      { key: '/super-admin/admins', icon: <UsergroupAddOutlined className='text-[25px]' />, label: 'Admins', path: '/super-admin/admins' },
      { key: '/super-admin/chat', icon: <MessageOutlined className='text-[25px]' />, label: 'Messages', path: '/super-admin/chat' },
      { key: '/super-admin/admin-chats', icon: <MessageOutlined className='text-[25px]' />, label: 'Messages', path: '/super-admin/admin-chats' },
      // { key: '/super-admin/analytics', icon: <AreaChartOutlined className='text-[25px]' />, label: 'Analytics', path: '/super-admin/analytics' },
      { key: '/super-admin/settings', icon: <SettingOutlined className='text-[25px]' />, label: 'Settings', path: '/super-admin/settings' },
    ],
    USER: [
      { key: '/user/chats', icon: <MessageOutlined className='text-[25px]' />, label: 'Chats', path: '/user/chats' },
      { key: '/user/calls', icon: <PhoneOutlined className='text-[25px]' />, label: 'Calls', path: '/user/calls' },
      { key: '/user/profile', icon: <UserOutlined className='text-[25px]' />, label: 'Profile', path: '/user/profile' },
    ],
  };

  return menuConfig[role]?.map(item => ({
    ...item,
    onClick: () => navigate(item.path),
  })) || [];
};
