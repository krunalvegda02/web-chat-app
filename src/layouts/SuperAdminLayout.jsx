import { useAuthGuard } from '../hooks/useAuthGuard';
import ThemeProvider from '../components/common/ThemeProvider';
import LayoutWrapper from '../layouts/LayoutWrapper';
import { LayoutProvider } from '../hooks/useLayout';


export default function SuperAdminLayout() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);

  // Show nothing while loading
  if (!user) return null;

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
