import { Layout } from 'antd';
import ThemeProvider from '../components/common/ThemeProvider';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const { Content } = Layout;

export default function AuthLayout() {
  const { user, token, initialized } = useSelector(s => s.auth);
  const isAuthenticated = !!user && !!token;
  const currentPath = window.location.pathname;

  console.log('🔐 [AuthLayout] Checking auth:', {
    isAuthenticated,
    userRole: user?.role,
    initialized,
    currentPath,
  });

  // ✅ If user is authenticated, redirect to appropriate dashboard
  // BUT: Allow PLATFORM_ADMIN users to access /user/chats routes
  if (isAuthenticated && initialized) {
    console.log('✅ [AuthLayout] User is authenticated, checking if redirect needed...');
    
    // ✅ If already on a user chat route, don't redirect
    if (currentPath.startsWith('/user/chats')) {
      console.log('✅ [AuthLayout] Already on chat route, allowing access');
      return (
        <ThemeProvider>
          <Layout className=" bg-gradient-to-br from-white via-blue-50 to-purple-50">
            <Content className="flex items-center justify-center px-4 py-8">
              <Outlet />
            </Content>
          </Layout>
        </ThemeProvider>
      );
    }

    // ✅ For other auth pages, redirect based on role
    if (user.role === 'PLATFORM_ADMIN') {
      console.log('🔐 [AuthLayout] PLATFORM_ADMIN on auth page, redirecting to /admin');
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'SUPER_ADMIN') {
      console.log('🔐 [AuthLayout] SUPER_ADMIN on auth page, redirecting to /super-admin/chats');
      return <Navigate to="/super-admin/chats" replace />;
    } else if (user.role === 'USER') {
      console.log('🔐 [AuthLayout] USER on auth page, redirecting to /user/chats');
      return <Navigate to="/user/chats" replace />;
    } else {
      console.log('🔐 [AuthLayout] Unknown role on auth page, redirecting to /user/chats');
      return <Navigate to="/user/chats" replace />;
    }
  }

  return (
    <ThemeProvider>
      <Layout className=" bg-gradient-to-br from-white via-blue-50 to-purple-50">
        {/* Centered Content */}
        <Content className="flex items-center justify-center px-4 py-8">
          <Outlet />
        </Content>
      </Layout>
    </ThemeProvider>
  );
}
