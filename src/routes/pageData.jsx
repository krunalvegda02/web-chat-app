import {
  MessageOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';

export const getMenuItems = (role, navigate) => {
  const menuConfig = {
    /* ============================
       PLATFORM ADMIN MENU
       ============================ */
    PLATFORM_ADMIN: [
      {
        key: '/admin/messages',
        icon: <MessageOutlined className="text-[22px]" />,
        label: 'Messages',
        path: '/admin',
      },
      {
        key: '/admin/platform-clients',
        icon: <TeamOutlined className="text-[22px]" />,
        label: 'Platform Users',
        path: '/admin/platform-clients',
      },
    ],


    /* ============================
       SUPER ADMIN MENU
       ============================ */
    SUPER_ADMIN: [
      {
        key: '/super-admin/chats',
        icon: <MessageOutlined className="text-[22px]" />,
        label: 'Chats',
        path: '/super-admin/chats',
      },
      {
        key: '/super-admin/monitoring',
        icon: <EyeOutlined className="text-[22px]" />,
        label: 'Chat Monitor',
        path: '/super-admin/admin-chats',
      },
      {
        key: '/super-admin/admins',
        icon: <TeamOutlined className="text-[22px]" />,
        label: 'Admins',
        path: '/super-admin/admins',
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
    ],
  };

  console.log('📋 [pageData] getMenuItems called', {
    role,
    hasMenuConfig: !!menuConfig[role],
    menuCount: menuConfig[role]?.length || 0,
  });

  return (
    menuConfig[role]?.map(item => ({
      ...item,
      onClick: () => navigate(item.path),
    })) || []
  );
};
