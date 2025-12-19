
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

  const menuItems = getMenuItems(user?.role, navigate);
  const activeKey = location.pathname;

  return (
    <aside
      ref={sidebarRef}
      className="fixed left-0 top-0 bottom-0 z-40 w-12 md:w-16 overflow-y-auto bg-white border-r border-gray-200"
    >
      <div className="flex flex-col h-full">
        {/* LOGO */}
        <div className="w-full py-3 px-2 border-b border-gray-100 flex items-center justify-center">
          <button
            onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/super-admin')}
            className="w-12 h-8 md:w-14 md:h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl bg-green-500 hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
          >
            C
          </button>
        </div>

        {/* MENU ITEMS */}
        <nav className="flex-1 flex flex-col items-center gap-2 md:gap-3 py-4 md:py-6 px-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeKey === item.path;

            return (
              <Tooltip key={item.key} title={item.label} placement="right">
                <button
                  onClick={item.onClick}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all duration-200 text-lg md:text-xl ${
                    isActive
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                </button>
              </Tooltip>
            );
          })}
        </nav>

        {/* USER AVATAR */}
        <div className="px-2 py-3 md:py-4 border-t border-gray-100 flex flex-col items-center gap-2 md:gap-3">
          <Tooltip title={user?.name} placement="right">
            <button
              onClick={() => navigate('/profile')}
              className="hover:scale-105 transition-transform"
            >
              <Avatar
                size={40}
                src={user?.avatar}
                icon={<UserOutlined />}
                className="shadow-sm border-2 border-gray-200"
                style={{
                  backgroundColor: '#10B981',
                }}
              />
            </button>
          </Tooltip>

          {/* ONLINE INDICATOR */}
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500" />
        </div>
      </div>
    </aside>
  );
}