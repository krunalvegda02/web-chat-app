import ThemeProvider from '../components/common/ThemeProvider';
import LayoutWrapper from '../layouts/LayoutWrapper';
import { LayoutProvider } from '../hooks/useLayout';
import { useAuthGuard } from '../hooks/useAuthGuard';


export default function AdminLayout() {
  const { user, isAuthorized } = useAuthGuard(['TENANT_ADMIN', 'PLATFORM_ADMIN']);

  console.log('🏢 [AdminLayout] Rendered', {
    hasUser: !!user,
    userRole: user?.role,
    isAuthorized,
  });

  // Show nothing while loading
  if (!user) {
    console.log('🏢 [AdminLayout] No user, returning null');
    return null;
  }

  if (!isAuthorized) {
    console.log('🏢 [AdminLayout] User not authorized, returning null');
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
