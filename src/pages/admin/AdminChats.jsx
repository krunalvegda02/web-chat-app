
import { useAuthGuard } from '../../hooks/useAuthGuard';
import StandardChatLayout from '../../components/chat/StandardChatLayout';
import { Card, Empty } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

export default function AdminChats() {
  const { user } = useAuthGuard(['TENANT_ADMIN', 'PLATFORM_ADMIN']);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="border-0 shadow-sm">
          <Empty description="Loading..." />
        </Card>
      </div>
    );
  }

  return <StandardChatLayout />;
}
