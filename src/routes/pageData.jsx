// import {
//   MessageOutlined,
//   BgColorsOutlined,
//   UsergroupAddOutlined,
//   AreaChartOutlined,
//   SettingOutlined,
//   DashboardOutlined,
//   PhoneFilled,
//   PhoneOutlined,
//   PhoneTwoTone,
//   PinterestOutlined,
//   UserOutlined,
//   ProfileFilled,
//   ProfileOutlined,
//   UserSwitchOutlined,
//   ContactsOutlined,
// } from '@ant-design/icons';
// import { FaPersonBooth, FaPhone, FaUserAlt, FaUserEdit } from 'react-icons/fa';

// export const getMenuItems = (role, navigate) => {
//   const menuConfig = {
//     ADMIN: [
//       { key: '/admin', icon: <MessageOutlined className='text-[25px]' />, label: 'Messages', path: '/admin' },
//       { key: '/contacts', icon: <ContactsOutlined className='text-[25px]' />, label: 'Contacts', path: '/contacts' },
//       { key: '/calls', icon: <PhoneOutlined className='text-[25px]' />, label: 'Calls', path: '/calls' },
//       { key: '/admin/theme', icon: <BgColorsOutlined className='text-[25px]' />, label: 'Appearance', path: '/admin/theme' },
//       { key: '/admin/users', icon: <UsergroupAddOutlined className='text-[25px]' />, label: 'Users', path: '/admin/users' },
// { key: '/admin/user-chat', icon: <MessageOutlined className='text-[25px]' />, label: 'Users', path: '/admin/user-chat' },
//       // { key: '/profile', icon: <UserOutlined className='text-[25px]' />, label: 'Profile', path: '/profile' },
//     ],
//     SUPER_ADMIN: [
//       { key: '/super-admin', icon: <DashboardOutlined className='text-[25px]' />, label: 'Dashboard', path: '/super-admin' },
//       { key: '/contacts', icon: <ContactsOutlined className='text-[25px]' />, label: 'Contacts', path: '/contacts' },
//       { key: '/calls', icon: <PhoneOutlined className='text-[25px]' />, label: 'Calls', path: '/calls' },
//       { key: '/super-admin/admins', icon: <UsergroupAddOutlined className='text-[25px]' />, label: 'Admins', path: '/super-admin/admins' },
//       { key: '/super-admin/chat', icon: <MessageOutlined className='text-[25px]' />, label: 'Messages', path: '/super-admin/chat' },
//       { key: '/super-admin/admin-chats', icon: <MessageOutlined className='text-[25px]' />, label: 'Monitor Chats', path: '/super-admin/admin-chats' },
//       // { key: '/super-admin/analytics', icon: <AreaChartOutlined className='text-[25px]' />, label: 'Analytics', path: '/super-admin/analytics' },
//       // { key: '/super-admin/settings', icon: <SettingOutlined className='text-[25px]' />, label: 'Settings', path: '/super-admin/settings' },
//       // { key: '/profile', icon: <UserOutlined className='text-[25px]' />, label: 'Profile', path: '/profile' },
//     ],
//     USER: [
//       { key: '/user/chats', icon: <MessageOutlined className='text-[25px]' />, label: 'Chats', path: '/user/chats' },
//       { key: '/contacts', icon: <ContactsOutlined className='text-[25px]' />, label: 'Contacts', path: '/contacts' },
//       { key: '/calls', icon: <PhoneOutlined className='text-[25px]' />, label: 'Calls', path: '/calls' },
//       // { key: '/profile', icon: <UserOutlined className='text-[25px]' />, label: 'Profile', path: '/profile' },
//     ],
//   };

//   return menuConfig[role]?.map(item => ({
//     ...item,
//     onClick: () => navigate(item.path),
//   })) || [];
// };








import {
  MessageOutlined,
  BgColorsOutlined,
  UsergroupAddOutlined,
  AreaChartOutlined,
  DashboardOutlined,
  PhoneOutlined,
  ContactsOutlined,
} from '@ant-design/icons';

export const getMenuItems = (role, navigate) => {
  const menuConfig = {
    /* ============================
       ADMIN MENU
       ============================ */
    ADMIN: [
      {
        key: '/admin/messages',
        icon: <MessageOutlined className="text-[22px]" />,
        label: 'Messages',
        path: '/admin',
      },
      {
        key: '/admin/contacts',
        icon: <ContactsOutlined className="text-[22px]" />,
        label: 'Contacts',
        path: '/contacts',
      },
      {
        key: '/admin/calls',
        icon: <PhoneOutlined className="text-[22px]" />,
        label: 'Calls',
        path: '/calls',
      },
      {
        key: '/admin/users',
        icon: <UsergroupAddOutlined className="text-[22px]" />,
        label: 'User Management',
        path: '/admin/users',
      },
      {
        key: '/admin/user-chat',
        icon: <MessageOutlined className='text-[25px]' />,
        label: 'Member Chats',
        path: '/admin/user-chat'
      },

      {
        key: '/admin/appearance',
        icon: <BgColorsOutlined className="text-[22px]" />,
        label: 'Appearance',
        path: '/admin/theme',
      },
    ],

    /* ============================
       SUPER ADMIN MENU
       ============================ */
    SUPER_ADMIN: [
      {
        key: '/super-admin/chats',
        icon: <MessageOutlined className="text-[22px]" />,
        label: 'Admin Messages',
        path: '/super-admin/chats',
      },
      {
        key: '/super-admin/monitoring',
        icon: <AreaChartOutlined className="text-[22px]" />,
        label: 'Chat Monitoring',
        path: '/super-admin/admin-chats',
      },
      {
        key: '/super-admin/admins',
        icon: <UsergroupAddOutlined className="text-[22px]" />,
        label: 'Admin Management',
        path: '/super-admin/admins',
      },
      {
        key: '/super-admin/contacts',
        icon: <ContactsOutlined className="text-[22px]" />,
        label: 'Contacts',
        path: '/contacts',
      },
      {
        key: '/super-admin/calls',
        icon: <PhoneOutlined className="text-[22px]" />,
        label: 'Calls',
        path: '/calls',
      },
    ],

    /* ============================
       USER MENU
       ============================ */
    USER: [
      {
        key: '/user/chats',
        icon: <MessageOutlined className="text-[22px]" />,
        label: 'Chats',
        path: '/user/chats',
      },
      {
        key: '/user/contacts',
        icon: <ContactsOutlined className="text-[22px]" />,
        label: 'Contacts',
        path: '/contacts',
      },
      {
        key: '/user/calls',
        icon: <PhoneOutlined className="text-[22px]" />,
        label: 'Calls',
        path: '/calls',
      },
    ],
  };

  return (
    menuConfig[role]?.map(item => ({
      ...item,
      onClick: () => navigate(item.path),
    })) || []
  );
};
