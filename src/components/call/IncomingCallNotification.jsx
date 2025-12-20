import { useState, useEffect, useRef } from 'react';
import { Avatar } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';

export default function IncomingCallNotification({ 
  caller, 
  onAccept, 
  onDecline 
}) {
  const [isAccepting, setIsAccepting] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Play ringtone when component mounts
    audioRef.current = new Audio('https://www.soundjay.com/phone/sounds/phone-calling-1.mp3');
    audioRef.current.loop = true;
    audioRef.current.play().catch(err => console.log('Ringtone play failed:', err));

    return () => {
      // Stop ringtone when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    await onAccept();
  };

  const handleDecline = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    await onDecline();
  };

  return (
    <div className="fixed top-4 right-4 z-[200] w-[400px] max-w-[90vw] bg-gradient-to-b from-[#005C4B] to-[#00A884] rounded-2xl shadow-2xl overflow-hidden">
      {/* Top Section - Caller Info */}
      <div className="flex flex-col items-center py-8 px-6">
        <Avatar
          size={80}
          src={caller?.avatar}
          style={{ 
            backgroundColor: '#DCF8C6',
            fontSize: '32px',
            color: '#005C4B',
          }}
        >
          {caller?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        
        <h2 className="text-white text-lg font-medium mt-4">
          {caller?.name || 'Unknown'}
        </h2>
        
        <p className="text-white/80 text-sm mt-1">
          WhatsApp Audio Call
        </p>

        {/* Animated ringing indicator */}
        <div className="flex gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Section - Action Buttons */}
      <div className="flex gap-12 justify-center pb-6 px-6">
        {/* Decline Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleDecline}
            disabled={isAccepting}
            className="w-14 h-14 rounded-full bg-[#FF3B30] hover:bg-[#E02020] active:bg-[#C01010] flex items-center justify-center transition-all shadow-lg disabled:opacity-50"
          >
            <PhoneOutlined 
              className="text-white text-xl" 
              style={{ transform: 'rotate(135deg)' }}
            />
          </button>
          <span className="text-white text-xs">Decline</span>
        </div>

        {/* Accept Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1BA84E] flex items-center justify-center transition-all shadow-lg disabled:opacity-50"
          >
            {isAccepting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PhoneOutlined className="text-white text-xl" />
            )}
          </button>
          <span className="text-white text-xs">{isAccepting ? 'Connecting...' : 'Accept'}</span>
        </div>
      </div>
    </div>
  );
}
