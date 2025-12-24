import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import UserChatLayout from "../layouts/UserLayout";
import SharedLayout from "../layouts/SharedLayout";
import { Navigate } from "react-router-dom";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
// import UserJoinPage from "../pages/user/UserJoinPage";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminChats";
import AdminThemeSettings from "../pages/admin/AdminThemeSettings";
import AdminUsersList from "../pages/admin/AdminUsersList";


// Super Admin Pages
import SuperAdminDashboard from "../pages/superAdmin/SuperAdminDashboard";
import SuperAdminAdminsList from "../pages/superAdmin/SuperAdmin_AdminsList";
import SuperAdminChat from "../pages/superAdmin/SuperAdminChat";

// User Pages
import UserChatPage from "../pages/user/UserChatPage";
import CallLogs from "../pages/common/CallLogsPage";
import Contacts from "../pages/common/ContactsPage";
import Profile from "../pages/common/Profile";
import UserProfile from "../pages/user/UserProfile";

// Error Pages
import Unauthorized from "../pages/common/Unauthorized";
import NotFound from "../pages/common/NotFound";
import SuperAdminAdminChats from "../pages/superAdmin/SuperAdmin_adminChats";
import AdminUsersChat from "../pages/admin/Admin_userschat";
import JoinPage from "../pages/user/JoinPage";

// ------------------------------------
// CENTRALIZED ROUTE CONFIG
// ------------------------------------
export const pageRoutes = [
    {
        layout: AuthLayout,
        routes: [
            { path: "/login", element: LoginPage },
            { path: "/register", element: RegisterPage },
            { path: "/reset-password", element: ResetPasswordPage },
            // { path: "/join/:tenantSlug", element: UserJoinPage },

            { path: "/join", element: JoinPage },
        ],
    },

    {
        layout: AdminLayout,
        requiredRoles: ["ADMIN", "TENANT_ADMIN"],
        routes: [
            { path: "/admin", element: AdminDashboard },
            { path: "/admin/theme", element: AdminThemeSettings },
            { path: "/admin/users", element: AdminUsersList },
            { path: "/admin/user-chat", element: AdminUsersChat },
        ],
    },
    {
        layout: SuperAdminLayout,
        requiredRoles: ["SUPER_ADMIN"],
        routes: [
            // { path: "/super-admin", element: SuperAdminDashboard },
            { path: "/super-admin/admins", element: SuperAdminAdminsList },
            { path: "/super-admin/chats", element: SuperAdminChat },
            { path: "/super-admin/admin-chats", element: SuperAdminAdminChats },
        ],
    },
    {
        layout: UserChatLayout,
        requiredRoles: ["USER"],
        routes: [
            { path: "/user/chats", element: UserChatPage },
            // Redirects for backward compatibility
            { path: "/user/contacts", element: () => <Navigate to="/contacts" replace /> },
            { path: "/user/calls", element: () => <Navigate to="/calls" replace /> },
        ],
    },

    // Shared routes for all authenticated users
    {
        layout: SharedLayout,
        requiredRoles: ["USER", "ADMIN", "TENANT_ADMIN", "SUPER_ADMIN"],
        routes: [
            { path: "/profile", element: Profile },
            { path: "/profile/:userId", element: UserProfile },
            { path: "/contacts", element: Contacts },
            { path: "/calls", element: CallLogs },
        ],
    },

    // Public error pages
    {
        layout: null,
        routes: [
            { path: "/unauthorized", element: Unauthorized },
            { path: "*", element: NotFound },
        ],
    },
];
