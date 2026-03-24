import { useAuthGuard } from '../hooks/useAuthGuard';
import ThemeProvider from '../components/common/ThemeProvider';
import LayoutWrapper from '../layouts/LayoutWrapper';
import { LayoutProvider } from '../hooks/useLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function SuperAdminLayout() {
  const { user, isAuthorized, isInitialized } = useAuthGuard(['SUPER_ADMIN']);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user || !isAuthorized) return null;

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
