
import { useAuthGuard } from '../../hooks/useAuthGuard';
import StandardChatLayout from '../../components/chat/StandardChatLayout';
import { Card, Empty } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

export default function AdminChats() {
  const { user } = useAuthGuard(['ADMIN']);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="border-0 shadow-sm">
          <Empty description="Loading..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageOutlined style={{ fontSize: '18px', color: '#10B981' }} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Chat Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage and monitor team conversations
            </p>
          </div>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 overflow-hidden">
        <StandardChatLayout />
      </div>
    </div>
  );
}
