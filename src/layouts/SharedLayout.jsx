import { useAuthGuard } from '../hooks/useAuthGuard';
import ThemeProvider from '../components/common/ThemeProvider';
import LayoutWrapper from '../layouts/LayoutWrapper';
import { LayoutProvider } from '../hooks/useLayout';
import { useSocket } from '../hooks/useSocket';

export default function SharedLayout() {
  const { user } = useAuthGuard(['USER', 'ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN']);
  
  useSocket();

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
