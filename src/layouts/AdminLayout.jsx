import ThemeProvider from '../components/common/ThemeProvider';
import LayoutWrapper from '../layouts/LayoutWrapper';
import { LayoutProvider } from '../hooks/useLayout';
import { useAuthGuard } from '../hooks/useAuthGuard';


export default function AdminLayout() {
  const { user } = useAuthGuard(['ADMIN']);

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
