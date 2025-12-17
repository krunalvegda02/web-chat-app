import { Layout } from 'antd';
import ThemeProvider from '../components/common/ThemeProvider';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

/**
 * Authentication Layout
 * Used for: Login, Signup, Forgot Password, etc.
 * No sidebar, no topbar, centered content
 */
export default function AuthLayout() {
  return (
    <ThemeProvider>
      <Layout className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50">
        {/* Centered Content */}
        <Content className="flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </ThemeProvider>
  );
}
