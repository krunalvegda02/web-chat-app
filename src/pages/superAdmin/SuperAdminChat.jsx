import { useAuthGuard } from '../../hooks/useAuthGuard';
import StandardChatLayout from '../../components/chat/StandardChatLayout';

export default function SuperAdminChat() {
  const { user } = useAuthGuard(['SUPER_ADMIN']);
  
  if (!user) return null;

  return <StandardChatLayout />;
}