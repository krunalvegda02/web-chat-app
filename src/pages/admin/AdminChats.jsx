
import { useAuthGuard } from '../../hooks/useAuthGuard';
import StandardChatLayout from '../../components/chat/StandardChatLayout';
import { Card, Empty } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

export default function AdminChats() {
  const { user, isAuthorized } = useAuthGuard(['TENANT_ADMIN', 'PLATFORM_ADMIN']);

  console.log('📄 [AdminChats] Rendered', {
    hasUser: !!user,
    userRole: user?.role,
    isAuthorized,
  });

  if (!user) {
    console.log('📄 [AdminChats] No user, showing loading');
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="border-0 shadow-sm">
          <Empty description="Loading..." />
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    console.log('📄 [AdminChats] User not authorized, showing empty');
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="border-0 shadow-sm">
          <Empty description="Access Denied" />
        </Card>
      </div>
    );
  }

  return <StandardChatLayout />;
}
