import ThemeProvider from '../components/common/ThemeProvider';
import LayoutWrapper from '../layouts/LayoutWrapper';
import { LayoutProvider } from '../hooks/useLayout';
import { useAuthGuard } from '../hooks/useAuthGuard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminLayout() {
  const { user, isAuthorized, isInitialized } = useAuthGuard(['TENANT_ADMIN', 'PLATFORM_ADMIN']);

  // Wait for auth to initialize — prevents white screen on iPhone during rehydration
  if (!isInitialized) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user || !isAuthorized) {
    return null;
  }

  return (
    <ThemeProvider>
      <LayoutProvider>
        <LayoutWrapper 
          hasSidebar={true}
          hasTopbar={true}
          footer={true}
        />
      </LayoutProvider>
    </ThemeProvider>
  );
}
