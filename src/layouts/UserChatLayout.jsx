import { useAuthGuard } from '../hooks/useAuthGuard';
import ThemeProvider from '../components/common/ThemeProvider';
import Topbar from '../components/common/Topbar';
import { useSocket } from '../hooks/useSocket';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { LayoutProvider } from '../hooks/useLayout';

const { Content } = Layout;

/**
 * User Chat Layout
 * Used for: User chat interface
 * Includes: Topbar only (no sidebar)
 * Features: Real-time messaging via Socket.io
 */
export default function UserChatLayout() {
  const { user } = useAuthGuard(['USER']);
  
  // Initialize socket connection
  useSocket();

  // Show nothing while loading
  if (!user) return null;

  return (
    <ThemeProvider>
      <LayoutProvider>
        <Layout className="min-h-screen bg-gradient-light">
          {/* Topbar Only */}
          <Topbar />

          {/* Chat Content */}
          <Content className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-light px-2 md:px-4 py-4">
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </LayoutProvider>
    </ThemeProvider>
  );
}
