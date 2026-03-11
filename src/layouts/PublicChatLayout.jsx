import ThemeProvider from '../components/common/ThemeProvider';
import { LayoutProvider } from '../hooks/useLayout';
import { useSocket } from '../hooks/useSocket';
import { Outlet } from 'react-router-dom';

/**
 * Public Chat Layout
 * Used for: Public chat access without authentication
 * Features: Real-time messaging via Socket.io (no auth required)
 */
export default function PublicChatLayout() {
  // Initialize socket connection
  useSocket();

  return (
    <ThemeProvider>
      <LayoutProvider>
        <div className="min-h-screen w-full" style={{ overscrollBehavior: 'none' }}>
          <main className="w-full" style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
            <Outlet />
          </main>
        </div>
      </LayoutProvider>
    </ThemeProvider>
  );
}
