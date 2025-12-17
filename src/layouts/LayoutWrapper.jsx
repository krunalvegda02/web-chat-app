import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";

export default function LayoutWrapper({ hasSidebar, hasTopbar, footer }) {
  return (
    <div className="min-h-screen w-full">

      {/* Topbar */}
      {hasTopbar && <Topbar />}

      {/* Sidebar */}
      {hasSidebar && <Sidebar />}

      {/* Content Wrapper */}
      <main
        className={`
          w-full 
          transition-all 
          ${hasTopbar ? "pt-" : ""}
          ${hasSidebar ? "pl-[72px]" : ""}
        `}

     style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.9) 0%, rgba(244,247,255,0.85) 40%, rgba(235,240,255,0.75) 100%),
          linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,245,255,0.85) 100%)
        `,
        backdropFilter: "blur(10px)",
      }}
      >
        {/* Outlet content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* {footer && (
        <footer className="text-center py-3 text-xs text-gray-500 fixed bottom-0 pl-[72px]">
          © {new Date().getFullYear()} ChatApp Dashboard
        </footer>
      )} */}
    </div>
  );
}
