import { useAuthGuard } from '../../hooks/useAuthGuard';
import StandardChatLayout from '../../components/chat/StandardChatLayout';

export default function AdminChats() {
  const { user } = useAuthGuard(['ADMIN']);
  
  if (!user) return null;

  return <StandardChatLayout />;
}
