import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import ThemeProvider from '../components/common/ThemeProvider';
import { LayoutProvider } from '../hooks/useLayout';
import { useSocket } from '../hooks/useSocket';
import { usePlatformDetection } from '../hooks/usePlatformDetection';
import LayoutWrapper from './LayoutWrapper';
import { Outlet } from 'react-router-dom';

/**
 * Public Chat Layout
 * Used for: Public chat access without authentication and Platform integration
 * Features: Conditionally hides sidebar based on platform user status
 */
export default function PublicChatLayout() {
  // Initialize socket connection
  useSocket();
  const { user } = useSelector((s) => s.auth);
  const { isDetected: isPlatformDetected } = usePlatformDetection();

  // Determine if it's a platform user - we hide sidebar for them
  const isPlatformUser = useMemo(() => {
    if (user && user.role !== 'USER') return false; // Only regular users can be external platform users
    const hasExternalId = !!user?.externalUserId;
    const hasPlatformId = !!user?.platformId;
    return hasExternalId || hasPlatformId || isPlatformDetected;
  }, [user, isPlatformDetected]);

  // Only real, internal users see the sidebar in the chat layout
  const hasSidebar = user && !isPlatformUser;

  return (
    <ThemeProvider>
      <LayoutProvider>
        <LayoutWrapper
          hasSidebar={hasSidebar}
          hasTopbar={hasSidebar}
          footer={false}
        />
      </LayoutProvider>
    </ThemeProvider>
  );
}
