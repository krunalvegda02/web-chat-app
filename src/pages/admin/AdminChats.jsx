import StandardChatLayout from '../../components/chat/StandardChatLayout';
import { Card, Empty } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

export default function AdminChats() {
  const { user } = useSelector(s => s.auth);

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
