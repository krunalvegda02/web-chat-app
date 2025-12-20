import { useState, useRef, useEffect, useCallback } from 'react';
import { chatSocketClient } from '../sockets/chatSocketClient';
import { message as antMessage } from 'antd';

export const useCall = () => {
  const [callState, setCallState] = useState({
    isInCall: false,
    isIncoming: false,
    callId: null,
    callType: 'audio',
    participant: null,
    callStatus: 'idle', // idle, calling, ringing, connected, ended
    duration: 0,
    isMuted: false,
    isSpeakerOn: false,
  });

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const missedCallTimerRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    durationIntervalRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Clear missed call timer
  const clearMissedCallTimer = useCallback(() => {
    if (missedCallTimerRef.current) {
      clearTimeout(missedCallTimerRef.current);
      missedCallTimerRef.current = null;
    }
  }, []);

  // Initialize peer connection
  const initializePeerConnection = useCallback(async () => {
    try {
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Get local audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play();
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && callState.callId && callState.participant) {
          chatSocketClient.sendICECandidate(
            callState.callId,
            callState.participant._id,
            event.candidate
          );
        }
      };

      return pc;
    } catch (error) {
      console.error('Failed to initialize peer connection:', error);
      antMessage.error('Failed to access microphone');
      throw error;
    }
  }, [callState.callId, callState.participant]);

  // Initiate call
  const initiateCall = useCallback(async (participant, roomId) => {
    try {
      console.log('📞 Initiating call to:', participant.name);
      setCallState({
        isInCall: true,
        isIncoming: false,
        callId: null,
        callType: 'audio',
        participant,
        callStatus: 'calling',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
      });

      await chatSocketClient.initiateCall(participant._id, 'audio', roomId);
      console.log('✅ Call initiated successfully');
    } catch (error) {
      console.error('Failed to initiate call:', error);
      antMessage.error('Failed to initiate call');
      setCallState(prev => ({ ...prev, isInCall: false, callStatus: 'idle' }));
    }
  }, []);

  // Accept call
  const acceptCall = useCallback(async () => {
    if (callState.callStatus === 'connected' || callState.callStatus === 'connecting') {
      console.log('⚠️ Call already accepted');
      return;
    }
    
    if (!callState.callId || !callState.participant) {
      console.error('❌ Cannot accept call: missing callId or participant');
      return;
    }
    
    try {
      clearMissedCallTimer();
      setCallState(prev => ({ ...prev, callStatus: 'connecting' }));
      
      const pc = await initializePeerConnection();
      
      await chatSocketClient.acceptCall(callState.callId, callState.participant._id);
      
      startDurationTimer();
    } catch (error) {
      console.error('Failed to accept call:', error);
      antMessage.error('Failed to accept call');
      setCallState({
        isInCall: false,
        isIncoming: false,
        callId: null,
        callType: 'audio',
        participant: null,
        callStatus: 'idle',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
      });
    }
  }, [callState.callId, callState.participant, callState.callStatus, initializePeerConnection, startDurationTimer, clearMissedCallTimer]);

  // Reject call
  const rejectCall = useCallback(async () => {
    if (!callState.callId || !callState.participant) {
      console.error('❌ Cannot reject call: missing callId or participant');
      return;
    }
    
    try {
      clearMissedCallTimer();
      await chatSocketClient.rejectCall(callState.callId, callState.participant._id);
      setCallState({
        isInCall: false,
        isIncoming: false,
        callId: null,
        callType: 'audio',
        participant: null,
        callStatus: 'idle',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
      });
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  }, [callState.callId, callState.participant, clearMissedCallTimer]);

  // End call
  const endCall = useCallback(async () => {
    try {
      clearMissedCallTimer();
      
      if (callState.callId && callState.participant) {
        await chatSocketClient.endCall(
          callState.callId,
          callState.participant._id,
          callState.duration
        );
      }

      stopDurationTimer();

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      setCallState({
        isInCall: false,
        isIncoming: false,
        callId: null,
        callType: 'audio',
        participant: null,
        callStatus: 'idle',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
      });
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }, [callState.callId, callState.participant, callState.duration, stopDurationTimer, clearMissedCallTimer]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
  }, []);

  // Socket event listeners
  useEffect(() => {
    const socket = chatSocketClient.getSocket();
    if (!socket) return;

    // Call initiated
    const handleCallInitiated = ({ callId }) => {
      console.log('📞 handleCallInitiated:', { callId });
      setCallState(prev => {
        console.log('📞 Previous state:', prev);
        const newState = { ...prev, callId, callStatus: 'ringing' };
        console.log('📞 New state:', newState);
        return newState;
      });
    };

    // Incoming call
    const handleIncomingCall = ({ callId, callerId, callerName, callerAvatar, callType, roomId }) => {
      setCallState({
        isInCall: true,
        isIncoming: true,
        callId,
        callType,
        participant: { _id: callerId, name: callerName, avatar: callerAvatar },
        callStatus: 'ringing',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
      });

      // Auto-decline after 30 seconds if not answered
      missedCallTimerRef.current = setTimeout(() => {
        console.log('⏰ Call timeout - auto declining');
        chatSocketClient.missedCall(callId, callerId);
        setCallState({
          isInCall: false,
          isIncoming: false,
          callId: null,
          callType: 'audio',
          participant: null,
          callStatus: 'idle',
          duration: 0,
          isMuted: false,
          isSpeakerOn: false,
        });
        antMessage.info('Missed call');
      }, 30000);
    };

    // Call accepted
    const handleCallAccepted = async ({ callId }) => {
      setCallState(prev => {
        if (prev.callStatus === 'connected' || prev.callStatus === 'connecting') {
          console.log('⚠️ Already connected, ignoring duplicate accept');
          return prev;
        }
        return { ...prev, callStatus: 'connecting' };
      });
      
      try {
        const pc = await initializePeerConnection();
        
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        setCallState(prev => {
          if (prev.participant?._id) {
            chatSocketClient.sendWebRTCOffer(
              callId,
              prev.participant._id,
              offer
            );
          }
          return prev;
        });
        
        startDurationTimer();
      } catch (error) {
        console.error('Failed to setup call after accept:', error);
        antMessage.error('Failed to connect call');
      }
    };

    // Call rejected
    const handleCallRejected = () => {
      clearMissedCallTimer();
      antMessage.info('Call was rejected');
      // Don't call endCall() - just clean up locally to avoid duplicate messages
      stopDurationTimer();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setCallState({
        isInCall: false,
        isIncoming: false,
        callId: null,
        callType: 'audio',
        participant: null,
        callStatus: 'idle',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
      });
    };

    // Call ended
    const handleCallEnded = () => {
      clearMissedCallTimer();
      // Don't call endCall() - just clean up locally to avoid duplicate messages
      stopDurationTimer();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setCallState({
        isInCall: false,
        isIncoming: false,
        callId: null,
        callType: 'audio',
        participant: null,
        callStatus: 'idle',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
      });
    };

    // Call missed
    const handleCallMissed = () => {
      clearMissedCallTimer();
      antMessage.warning('Call was not answered');
      // Don't call endCall() - just clean up locally to avoid duplicate messages
      stopDurationTimer();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setCallState({
        isInCall: false,
        isIncoming: false,
        callId: null,
        callType: 'audio',
        participant: null,
        callStatus: 'idle',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
      });
    };

    // WebRTC offer
    const handleWebRTCOffer = async ({ callId, userId, offer }) => {
      console.log('📥 Received WebRTC offer');
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        await chatSocketClient.sendWebRTCAnswer(callId, userId, answer);
        console.log('✅ Setting status to connected (receiver)');
        setCallState(prev => ({ ...prev, callStatus: 'connected', isIncoming: false }));
      }
    };

    // WebRTC answer
    const handleWebRTCAnswer = async ({ answer }) => {
      console.log('📥 Received WebRTC answer');
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Setting status to connected (caller)');
        setCallState(prev => ({ ...prev, callStatus: 'connected' }));
      }
    };

    // ICE candidate
    const handleICECandidate = async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on('call_initiated', handleCallInitiated);
    socket.on('call_incoming', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_missed', handleCallMissed);
    socket.on('webrtc_offer', handleWebRTCOffer);
    socket.on('webrtc_answer', handleWebRTCAnswer);
    socket.on('webrtc_ice_candidate', handleICECandidate);

    return () => {
      socket.off('call_initiated', handleCallInitiated);
      socket.off('call_incoming', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_missed', handleCallMissed);
      socket.off('webrtc_offer', handleWebRTCOffer);
      socket.off('webrtc_answer', handleWebRTCAnswer);
      socket.off('webrtc_ice_candidate', handleICECandidate);
    };
  }, [initializePeerConnection, startDurationTimer, endCall, clearMissedCallTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMissedCallTimer();
      stopDurationTimer();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopDurationTimer, clearMissedCallTimer]);

  return {
    callState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  };
};
