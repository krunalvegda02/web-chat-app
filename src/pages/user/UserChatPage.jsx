import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useTheme } from '../../hooks/useTheme';
import StandardChatLayout from '../../components/chat/StandardChatLayout';
import { Spin } from 'antd';

export default function UserChat() {
  const { theme } = useTheme();
  const { user, loading } = useAuthGuard(['USER']);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
      >
        <Spin size="large" tip="Loading chat..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      style={{
        backgroundColor: theme.backgroundColor || '#FFFFFF',
        minHeight: '100vh',
      }}
    >
      <StandardChatLayout />
    </div>
  );
}
