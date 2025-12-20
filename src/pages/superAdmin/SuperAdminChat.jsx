import { useAuthGuard } from '../../hooks/useAuthGuard';
import StandardChatLayout from '../../components/chat/StandardChatLayout';
import { Spin } from 'antd';

export default function SuperAdminChat() {
  const { user, isLoading, isInitialized } = useAuthGuard(['SUPER_ADMIN']);
  
  if (!isInitialized || isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Unauthorized access</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%', background: '#FFFFFF', overflow: 'hidden' }}>
      <StandardChatLayout />
    </div>
  );
}