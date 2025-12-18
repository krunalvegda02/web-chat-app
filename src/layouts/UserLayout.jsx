import { useAuthGuard } from '../hooks/useAuthGuard';
import ThemeProvider from '../components/common/ThemeProvider';
import LayoutWrapper from '../layouts/LayoutWrapper';
import { LayoutProvider } from '../hooks/useLayout';
import { useSocket } from '../hooks/useSocket';

/**
 * User Chat Layout
 * Used for: User chat interface
 * Includes: Topbar and Sidebar
 * Features: Real-time messaging via Socket.io
 */
export default function UserLayout() {
  const { user } = useAuthGuard(['USER']);
  
  // Initialize socket connection
  useSocket();

  // Show nothing while loading
  if (!user) return null;

  return (
    <ThemeProvider>
      <LayoutProvider>
        <LayoutWrapper 
          hasSidebar={true}
          hasTopbar={true}
          footer={false}
        />
      </LayoutProvider>
    </ThemeProvider>
  );
}
