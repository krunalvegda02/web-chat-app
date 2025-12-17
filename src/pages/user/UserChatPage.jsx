
// ============================================================================
// USER CHAT PAGE - pages/user/UserChatPage.jsx
// ============================================================================

import RoomList from '../../components/chat/RoomList';
import ChatWindow from '../../components/chat/ChatWindow';
import { useAuthGuard } from '../../hooks/useAuthGuard';

export default function UserChatPage() {
  const { user } = useAuthGuard(['USER']);

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-60px)] flex gap-4 p-4">
      <div className="w-72">
        <RoomList />
      </div>
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  );
}