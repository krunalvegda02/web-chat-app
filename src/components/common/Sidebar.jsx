import { useRef } from 'react';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMenuItems } from '../../routes/pageData';

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  // Get items according to role
  const menuItems = getMenuItems(user?.role, navigate);
  const activeKey = location.pathname; // current URL

  return (
    <aside
      ref={sidebarRef}
      className="fixed left-0 top-0 bottom-0 z-40 w-[72px] overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 50%, #F0F4FF 100%)',
      }}
    >
      <div className="flex flex-col h-full">

        {/* LOGO */}
        <div
          className="w-full py-2.5 px-1 border-b flex items-center justify-center"
          style={{
            borderColor: 'rgba(139, 92, 246, 0.15)',
          }}
        >
          <div
            className="w-12 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            }}
            onClick={() =>
              navigate(user?.role === 'ADMIN' ? '/admin' : '/super-admin')
            }
          >
            C
          </div>
        </div>

        {/* MENU ITEMS */}
        <nav className="flex-1 flex flex-col items-center gap-3 py-6 px-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeKey === item.path;

            return (
              <Tooltip key={item.key} title={item.label} placement="right">
                <button
                  onClick={item.onClick}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.25))'
                      : 'transparent',
                    color: isActive ? '#8B5CF6' : '#6B7280',
                    border: isActive
                      ? '2px solid #8B5CF6'
                      : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.10))';
                      e.currentTarget.style.color = '#8B5CF6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#6B7280';
                    }
                  }}
                >
                  {item.icon}
                </button>
              </Tooltip>
            );
          })}
        </nav>

        {/* USER AVATAR */}
        <div
          className="px-2 py-4 border-t flex flex-col items-center gap-3"
          style={{
            borderColor: 'rgba(139, 92, 246, 0.15)',
          }}
        >
          <Tooltip title={user?.name} placement="right">
            <Avatar
              size={44}
              src={user?.avatar}
              icon={<UserOutlined />}
              className="shadow-md hover:scale-110 transition-transform border border-transparent hover:border-purple-300 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              }}
              onClick={() => navigate('/profile')}
            />
          </Tooltip>

          {/* ONLINE INDICATOR */}
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#10B981' }}
          />
        </div>
      </div>
    </aside>
  );
}




// import { useRef, useState, useMemo } from 'react';
// import { Avatar, Tooltip, Menu, Button, Badge, Empty } from 'antd';
// import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';
// import { useTheme } from '../../hooks/useTheme';
// import { getMenuItems } from '../../routes/pageData';

// /**
//  * ✅ ENHANCED Sidebar Component with Full Theme Support
//  * 
//  * Features:
//  * - Theme-based colors and styling
//  * - Dynamic menu based on user role
//  * - Smooth transitions
//  * - User profile section
//  * - Responsive design
//  * - Active menu item highlighting
//  * - Hover effects
//  */
// export default function Sidebar({ collapsed = false, onCollapse = null }) {
//   const { user, logout } = useAuth();
//   const { theme, styles } = useTheme();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const sidebarRef = useRef(null);

//   const [hoveredItem, setHoveredItem] = useState(null);

//   // ✅ Get menu items based on user role
//   const menuItems = useMemo(
//     () => getMenuItems(user?.role, navigate),
//     [user?.role, navigate]
//   );

//   // ✅ Get active menu key from current path
//   const activeKey = useMemo(
//     () => location.pathname,
//     [location.pathname]
//   );

//   // ✅ Dynamic styles based on theme
//   const dynamicStyles = {
//     sidebarContainer: {
//       background: theme.sidebarBackground,
//       borderRight: `1px solid ${theme.sidebarBorderColor}`,
//       height: '100vh',
//       display: 'flex',
//       flexDirection: 'column',
//       overflowY: 'auto',
//       transition: `all ${theme.transitionDuration}ms ease`,
//       overflowX: 'hidden',
//     },
//     profileSection: {
//       padding: '16px',
//       borderBottom: `1px solid ${theme.sidebarBorderColor}`,
//       background: theme.sidebarBackground,
//       display: 'flex',
//       alignItems: 'center',
//       gap: 12,
//     },
//     profileInfo: {
//       flex: 1,
//       minWidth: 0,
//     },
//     profileName: {
//       fontSize: '14px',
//       fontWeight: '600',
//       color: theme.sidebarText,
//       margin: 0,
//       whiteSpace: 'nowrap',
//       overflow: 'hidden',
//       textOverflow: 'ellipsis',
//     },
//     profileRole: {
//       fontSize: '12px',
//       color: theme.headerTextSecondary,
//       margin: '4px 0 0 0',
//     },
//     menuContainer: {
//       flex: 1,
//       padding: '12px 0',
//       overflow: 'y',
//     },
//     menuItemContainer: {
//       padding: '8px 12px',
//       margin: '0 8px',
//       borderRadius: '6px',
//       cursor: 'pointer',
//       display: 'flex',
//       alignItems: 'center',
//       gap: 12,
//       transition: `all ${theme.transitionDuration}ms ease`,
//       textDecoration: 'none',
//       color: theme.sidebarText,
//       fontSize: '14px',
//     },
//     menuItemActive: {
//       background: theme.sidebarBgActive,
//       color: theme.sidebarTextActive,
//       fontWeight: '600',
//     },
//     menuItemHover: {
//       background: theme.sidebarBgHover,
//     },
//     menuItemIcon: {
//       fontSize: '18px',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       minWidth: '24px',
//     },
//     menuItemLabel: {
//       flex: 1,
//       whiteSpace: 'nowrap',
//       overflow: 'hidden',
//       textOverflow: 'ellipsis',
//     },
//     menuItemBadge: {
//       fontSize: '12px',
//       padding: '2px 6px',
//       borderRadius: '12px',
//       background: theme.accentColor,
//       color: '#fff',
//     },
//     footerSection: {
//       padding: '12px',
//       borderTop: `1px solid ${theme.sidebarBorderColor}`,
//       background: theme.sidebarBackground,
//       display: 'flex',
//       gap: 8,
//     },
//     logoutBtn: {
//       flex: 1,
//       width: '100%',
//     },
//   };

//   // ✅ Handle logout
//   const handleLogout = async () => {
//     await logout();
//     navigate('/login');
//   };

//   return (
//     <div
//       ref={sidebarRef}
//       style={dynamicStyles.sidebarContainer}
//       className="sidebar"
//     >
//       {/* ✅ PROFILE SECTION */}
//       <div style={dynamicStyles.profileSection}>
//         <Avatar
//           size={40}
//           src={user?.avatar}
//           icon={<UserOutlined />}
//           style={{
//             background: theme.primaryColor,
//             flexShrink: 0,
//           }}
//         />
//         {!collapsed && (
//           <div style={dynamicStyles.profileInfo}>
//             <p style={dynamicStyles.profileName} title={user?.name}>
//               {user?.name || 'User'}
//             </p>
//             <p style={dynamicStyles.profileRole}>
//               {user?.role?.charAt(0).toUpperCase() +
//                 user?.role?.slice(1).toLowerCase()}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* ✅ MENU SECTION */}
//       <div style={dynamicStyles.menuContainer}>
//         {menuItems && menuItems.length > 0 ? (
//           menuItems.map((item) => (
//             <Tooltip
//               key={item.key}
//               title={collapsed ? item.label : ''}
//               placement="right"
//             >
//               <div
//                 style={{
//                   ...dynamicStyles.menuItemContainer,
//                   ...(activeKey === item.key && dynamicStyles.menuItemActive),
//                   ...(hoveredItem === item.key && dynamicStyles.menuItemHover),
//                 }}
//                 onMouseEnter={() => setHoveredItem(item.key)}
//                 onMouseLeave={() => setHoveredItem(null)}
//                 onClick={() => {
//                   item.onClick?.();
//                   navigate(item.key);
//                 }}
//               >
//                 <div style={dynamicStyles.menuItemIcon}>
//                   {item.icon}
//                 </div>

//                 {!collapsed && (
//                   <>
//                     <span style={dynamicStyles.menuItemLabel}>
//                       {item.label}
//                     </span>
//                     {item.badge && (
//                       <Badge
//                         count={item.badge}
//                         style={{
//                           background: theme.accentColor,
//                         }}
//                       />
//                     )}
//                   </>
//                 )}
//               </div>
//             </Tooltip>
//           ))
//         ) : (
//           <Empty
//             description="No menu items"
//             style={{
//               marginTop: '20px',
//               color: theme.headerTextSecondary,
//             }}
//           />
//         )}
//       </div>

//       {/* ✅ FOOTER SECTION - LOGOUT */}
//       <div style={dynamicStyles.footerSection}>
//         <Button
//           type="primary"
//           danger
//           icon={<LogoutOutlined />}
//           onClick={handleLogout}
//           style={{
//             width: collapsed ? '36px' : 'auto',
//             borderColor: '#ff4d4f',
//             background: '#ff4d4f',
//             color: '#fff',
//           }}
//           title="Logout"
//         >
//           {!collapsed && 'Logout'}
//         </Button>
//       </div>

//       {/* ✅ CUSTOM SCROLLBAR STYLING */}
//       <style>{`
//         .sidebar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .sidebar::-webkit-scrollbar-track {
//           background: transparent;
//         }
//         .sidebar::-webkit-scrollbar-thumb {
//           background: ${theme.borderColor};
//           border-radius: 3px;
//         }
//         .sidebar::-webkit-scrollbar-thumb:hover {
//           background: ${theme.headerTextSecondary};
//         }
//       `}</style>
//     </div>
//   );
// }