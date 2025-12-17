import { useAuthGuard } from '../../hooks/useAuthGuard';
import RoomList from '../../components/chat/RoomList';
import ChatWindow from '../../components/chat/ChatWindow';
import { useSocket } from '../../hooks/useSocket';
import { useSelector } from 'react-redux';

export default function AdminChats() {
  const { user } = useAuthGuard(['ADMIN']);
  useSocket(); // Initialize socket connection

  if (!user) return null;

  const usera = useSelector((state) => state);
  console.log('AdminChats rendered', usera);

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
