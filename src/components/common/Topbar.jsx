import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Dropdown, Avatar, Badge } from "antd";
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const getPageTitle = () => {
    if (location.pathname.includes("admin")) return "Admin Dashboard";
    if (location.pathname.includes("super-admin")) return "Super Admin Dashboard";
    if (location.pathname.includes("chat")) return "Chat";
    return "Dashboard";
  };

  const userMenu = [
    {
      key: "profile",
      label: "My Profile",
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    {
      key: "settings",
      label: "Account Settings",
      icon: <SettingOutlined />,
      onClick: () => navigate("/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "help",
      label: "Help & Support",
      icon: <QuestionCircleOutlined />,
      onClick: () => navigate("/help"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        logout();
        navigate("/login");
      },
    },
  ];

  const notifications = [
    {
      key: "1",
      label: (
        <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <BellOutlined className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">New message</p>
            <p className="text-xs text-gray-500">2 min ago</p>
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <UserOutlined className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">New user joined</p>
            <p className="text-xs text-gray-500">1 hr ago</p>
          </div>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "viewall",
      label: (
        <p
          className="text-center text-indigo-600 font-medium cursor-pointer py-2 hover:text-indigo-700"
          onClick={() => navigate("/notifications")}
        >
          View All
        </p>
      ),
    },
  ];

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b border-indigo-100/40 backdrop-blur-xl shadow-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.9) 50%, rgba(240, 244, 255, 0.9) 100%)',
        marginLeft: '70px',
      }}
    >
      <div className="flex items-center justify-between h-full px-6 gap-4">

        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="text-lg font-bold text-gray-800 tracking-tight truncate">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
        </div>

        <div className="flex items-center gap-2">

          <Dropdown menu={{ items: notifications }} trigger={["click"]} placement="bottomRight">
            <Badge count={3} size="small" className="cursor-pointer">
              <div
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-indigo-100 text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%)',
                }}
              >
                <BellOutlined className="text-base font-bold" />
              </div>
            </Badge>
          </Dropdown>

          <div className="hidden sm:block w-px h-6 bg-gray-300/40 mx-2" />

          <Dropdown menu={{ items: userMenu }} trigger={["click"]} placement="bottomRight">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 truncate">
                  {user?.name}
                </span>
                <span className="text-xs text-gray-500 capitalize truncate">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>

              <Avatar
                size={40}
                src={user?.avatar}
                icon={<UserOutlined />}
                className="border-2 border-white shadow group-hover:scale-105 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                }}
              />
            </div>
          </Dropdown>

        </div>
      </div>
    </header>
  );
}
