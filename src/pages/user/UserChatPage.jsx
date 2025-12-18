




import { useAuthGuard } from '../../hooks/useAuthGuard';
import StandardChatLayout from '../../components/chat/StandardChatLayout';

export default function UserChat() {
  const { user } = useAuthGuard(['USER']);
  
  if (!user) return null;

  return <StandardChatLayout />;
}