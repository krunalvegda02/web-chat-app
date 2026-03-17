import {
  MessageOutlined,
  BgColorsOutlined,
  UsergroupAddOutlined,
  AreaChartOutlined,
  DashboardOutlined,
  ContactsOutlined,
  EyeOutlined,
  TeamOutlined,
  CommentOutlined,
  BookOutlined,
  SolutionOutlined,
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
      // {
      //   key: '/admin/contacts',
      //   icon: <SolutionOutlined className="text-[22px]" />,
      //   label: 'Contacts',
      //   path: '/contacts',
      // },
      {
        key: '/admin/platform-clients',
        icon: <TeamOutlined className="text-[22px]" />,
        label: 'Platform Users',
        path: '/admin/platform-clients',
      },
      // {
      //   key: '/admin/user-chat',
      //   icon: <CommentOutlined className="text-[22px]" />,
      //   label: 'User Chats',
      //   path: '/admin/user-chat',
      // },
      {
        key: '/admin/appearance',
        icon: <BgColorsOutlined className="text-[22px]" />,
        label: 'Appearance',
        path: '/admin/theme',
      },
    ],

    /* ============================
       TENANT ADMIN MENU
       ============================ */
    TENANT_ADMIN: [
      {
        key: '/admin/messages',
        icon: <MessageOutlined className="text-[22px]" />,
        label: 'Messages',
        path: '/admin',
      },
      // {
      //   key: '/admin/contacts',
      //   icon: <SolutionOutlined className="text-[22px]" />,
      //   label: 'Contacts',
      //   path: '/contacts',
      // },
      {
        key: '/admin/users',
        icon: <TeamOutlined className="text-[22px]" />,
        label: 'User Management',
        path: '/admin/users',
      },
      // {
      //   key: '/admin/user-chat',
      //   icon: <CommentOutlined className="text-[22px]" />,
      //   label: 'Member Chats',
      //   path: '/admin/user-chat',
      // },
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
        icon: <EyeOutlined className="text-[22px]" />,
        label: 'Chat Monitoring',
        path: '/super-admin/admin-chats',
      },
      {
        key: '/super-admin/admins',
        icon: <TeamOutlined className="text-[22px]" />,
        label: 'Admin Management',
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
      {
        key: '/user/contacts',
        icon: <ContactsOutlined className="text-[22px]" />,
        label: 'Contacts',
        path: '/contacts',
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
