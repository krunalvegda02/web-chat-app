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
          className="w-full py-3 px-1 border-b flex items-center justify-center"
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
