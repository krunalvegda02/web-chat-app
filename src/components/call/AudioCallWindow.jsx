import { useState, useEffect, useRef } from 'react';
import { Avatar } from 'antd';
import {
  PhoneOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  SoundOutlined,
} from '@ant-design/icons';

export default function AudioCallWindow({ 
  participant, 
  callStatus = 'calling', // 'calling', 'ringing', 'connected', 'ended'
  onEndCall,
  onToggleMute,
  isMuted = false,
  onToggleSpeaker,
  isSpeakerOn = false,
  callDuration = 0,
  onMinimize,
}) {
  const [duration, setDuration] = useState(callDuration);
  const intervalRef = useRef(null);

  useEffect(() => {
    setDuration(callDuration);
  }, [callDuration]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(duration);
      case 'ended':
        return 'Call Ended';
      default:
        return '';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[200] w-[400px] max-w-[90vw] bg-gradient-to-b from-[#005C4B] to-[#00A884] rounded-2xl shadow-2xl overflow-hidden">
      {/* Minimize button */}
      {onMinimize && (
        <button
          onClick={onMinimize}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs"
        >
          ✕
        </button>
      )}
      
      {/* Top Section - Participant Info */}
      <div className="flex flex-col items-center py-8 px-6">
        <Avatar
          size={80}
          src={participant?.avatar}
          style={{ 
            backgroundColor: '#DCF8C6',
            fontSize: '32px',
            color: '#005C4B',
          }}
        >
          {participant?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        
        <h2 className="text-white text-lg font-medium mt-4">
          {participant?.name || 'Unknown'}
        </h2>
        
        <p className="text-white/80 text-sm mt-1">
          {getStatusText()}
        </p>

        {/* Animated calling indicator */}
        {(callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connecting') && (
          <div className="flex gap-1 mt-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section - Controls */}
      <div className="flex flex-col items-center gap-4 pb-6 px-6">
        {/* Action Buttons - Show for both caller and receiver when connected */}
        {callStatus === 'connected' && (
          <div className="flex gap-4">
            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-all"
            >
              {isMuted ? (
                <AudioMutedOutlined className="text-white text-lg" />
              ) : (
                <AudioOutlined className="text-white text-lg" />
              )}
            </button>

            {/* Speaker Button */}
            <button
              onClick={onToggleSpeaker}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-all"
            >
              <SoundOutlined 
                className="text-white text-lg" 
                style={{ opacity: isSpeakerOn ? 1 : 0.6 }}
              />
            </button>
          </div>
        )}

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="w-14 h-14 rounded-full bg-[#FF3B30] hover:bg-[#E02020] active:bg-[#C01010] flex items-center justify-center transition-all shadow-lg"
        >
          <PhoneOutlined 
            className="text-white text-xl" 
            style={{ transform: 'rotate(135deg)' }}
          />
        </button>
      </div>
    </div>
  );
}
