import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import UserChatLayout from "../layouts/UserLayout";
import PublicChatLayout from "../layouts/PublicChatLayout";
import SharedLayout from "../layouts/SharedLayout";
import PlatformAwareRoute from "./PlatformAwareRoute";
import RootRedirect from "../components/routing/RootRedirect";
// import SimpleLoginRedirect from "../components/routing/SimpleLoginRedirect";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage";
import PlatformAuth from "../components/auth/PlatformAuth";

// Super Admin Pages
import SuperAdminDashboard from "../pages/superAdmin/SuperAdminDashboard";
import SuperAdminAdminsList from "../pages/superAdmin/SuperAdmin_AdminsList";
import SuperAdminChat from "../pages/superAdmin/SuperAdminChat";
import SuperAdminAdminChats from "../pages/superAdmin/SuperAdmin_adminChats";
import SuperAdminWalletRequests from "../pages/superAdmin/SuperAdminWalletRequests";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminChats";
import AdminUsersList from "../pages/admin/AdminUsersList";
import AdminUsersChat from "../pages/admin/Admin_userschat";
import PlatformClients from "../pages/admin/PlatformClients";
import WhatsAppTestPage from "../pages/admin/WhatsAppTestPage";
import WalletPage from "../pages/admin/WalletPage";

// User Pages
import UserChatPage from "../pages/user/UserChatPage";
import CallLogs from "../pages/common/CallLogsPage";
import Profile from "../pages/common/Profile";

// Error Pages
import Unauthorized from "../pages/common/Unauthorized";
import NotFound from "../pages/common/NotFound";

// ------------------------------------
// CENTRALIZED ROUTE CONFIG
// ------------------------------------
export const pageRoutes = [
    // ✅ PLATFORM ROUTES FIRST: Direct chat access for platform users (NO AUTH REQUIRED)
    // Wrapped with PlatformAwareRoute to prevent rendering until auth is complete
    {
        layout: PublicChatLayout,
        requiredRoles: null,
        wrapper: PlatformAwareRoute,
        routes: [
            { path: "/user/chats/:roomId", element: UserChatPage },
            { path: "/user/chats", element: UserChatPage },
        ],
    },

    // Auth Pages
    {
        layout: AuthLayout,
        routes: [
            { path: "/login", element: LoginPage },
            { path: "/platform-auth", element: PlatformAuth },
        ],
    },

    // Admin Routes
    {
        layout: AdminLayout,
        requiredRoles: ["PLATFORM_ADMIN"],
        routes: [
            { path: "/admin", element: AdminDashboard },
            { path: "/admin/users", element: AdminUsersList },
            { path: "/admin/user-chat", element: AdminUsersChat },
            { path: "/admin/platform-clients", element: PlatformClients },
            { path: "/admin/whatsapp-test", element: WhatsAppTestPage },
            { path: "/admin/wallet", element: WalletPage },
        ],
    },

    // Super Admin Routes
    {
        layout: SuperAdminLayout,
        requiredRoles: ["SUPER_ADMIN"],
        routes: [
            { path: "/super-admin/admins", element: SuperAdminAdminsList },
            { path: "/super-admin/chats", element: SuperAdminChat },
            { path: "/super-admin/admin-chats", element: SuperAdminAdminChats },
            { path: "/super-admin/wallet-requests", element: SuperAdminWalletRequests },
        ],
    },

    // Authenticated User Routes
    {
        layout: UserChatLayout,
        requiredRoles: ["USER", "PLATFORM_ADMIN"],
        routes: [
            { path: "/user/contacts", element: () => <Navigate to="/contacts" replace /> },
            { path: "/user/calls", element: () => <Navigate to="/calls" replace /> },
        ],
    },

    // Shared routes for all authenticated users
    {
        layout: SharedLayout,
        requiredRoles: ["USER", "PLATFORM_ADMIN", "SUPER_ADMIN"],
        routes: [
            { path: "/profile", element: Profile },
            { path: "/calls", element: CallLogs },
        ],
    },

    // Public error pages and default redirect
    {
        layout: null,
        routes: [
            { path: "/", element: RootRedirect },
            // { path: "/home", element: SimpleLoginRedirect }, // Fallback route
            { path: "/unauthorized", element: Unauthorized },
            { path: "*", element: NotFound },
        ],
    },
];
