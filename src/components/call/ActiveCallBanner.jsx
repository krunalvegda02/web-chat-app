import { PhoneOutlined } from '@ant-design/icons';

export default function ActiveCallBanner({ participant, callStatus, duration, onClick }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (callStatus === 'calling' || callStatus === 'ringing') return 'Calling...';
    if (callStatus === 'connecting') return 'Connecting...';
    if (callStatus === 'connected') return formatDuration(duration);
    return '';
  };

  return (
    <div
      onClick={onClick}
      className="fixed top-0 left-0 right-0 z-[150] bg-[#00A884] text-white py-2 px-4 flex items-center justify-between cursor-pointer hover:bg-[#008069] transition-colors"
    >
      <div className="flex items-center gap-3">
        <PhoneOutlined className="text-lg animate-pulse" />
        <div>
          <div className="font-medium text-sm">{participant?.name || 'Unknown'}</div>
          <div className="text-xs opacity-90">{getStatusText()}</div>
        </div>
      </div>
      <div className="text-xs opacity-75">Tap to return to call</div>
    </div>
  );
}
