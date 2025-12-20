import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

export default function LayoutWrapper({ hasSidebar, hasTopbar, footer }) {
  const location = useLocation();
  const isInChat = location.pathname.includes('/chat') || location.pathname.includes('/user');
  
  return (
    <div className="min-h-screen w-full" style={{ overscrollBehavior: 'none' }}>

      {/* Topbar */}
      {hasTopbar && <Topbar />}

      {/* Sidebar */}
      {hasSidebar && <Sidebar />}

      {/* Content Wrapper */}
      <main
        className={`
          w-full 
          transition-all 
          ${hasSidebar 
            ? "sm:pl-20"
            : "pl-0"}
          ${isInChat ? "" : "mb-14 md:mb-0"}
        `}
        style={{
          minHeight: '97vh',
          backgroundColor: '#F9FAFB',
        }}
      >
        {/* Outlet content */}
        <Outlet />
      </main>

      {/* {footer && (
        <footer className="text-center py-3 text-xs text-gray-500 fixed bottom-0 pl-[72px]">
          © {new Date().getFullYear()} ChatApp Dashboard
        </footer>
      )} */}
    </div>
  );
}
