import { useEffect, useRef, useState } from 'react';
import { Modal, Button, Space, message } from 'antd';
import {
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  VideoCameraAddOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { webrtcService } from '../../services/webrtcService';
import { chatSocketClient } from '../../sockets/chatSocketClient';

export default function VideoCallModal({
  visible,
  onClose,
  callType,
  targetUserId,
  targetUserName,
  isIncoming = false,
  callerId = null,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(callType === 'video');
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'connecting');

  useEffect(() => {
    if (!visible) return;

    const setupCall = async () => {
      try {
        const stream = await webrtcService.getLocalStream(true, callType === 'video');
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        await webrtcService.initializePeerConnection(
          (candidate) => {
            chatSocketClient.emit('webrtc_ice_candidate', {
              targetUserId: isIncoming ? callerId : targetUserId,
              candidate,
            });
          },
          (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          }
        );

        if (!isIncoming) {
          chatSocketClient.emit('call_initiate', {
            targetUserId,
            callType,
          });

          const offer = await webrtcService.createOffer();
          chatSocketClient.emit('webrtc_offer', {
            targetUserId,
            offer,
          });
        }
      } catch (error) {
        console.error('Error setting up call:', error);
        message.error('Failed to access camera/microphone');
        onClose();
      }
    };

    const handleCallAccepted = async () => {
      setCallStatus('connected');
    };

    const handleCallRejected = () => {
      message.info('Call was rejected');
      onClose();
    };

    const handleCallEnded = () => {
      message.info('Call ended');
      onClose();
    };

    const handleWebRTCOffer = async ({ userId, offer }) => {
      try {
        await webrtcService.handleOffer(offer);
        const answer = await webrtcService.createAnswer();
        chatSocketClient.emit('webrtc_answer', {
          targetUserId: userId,
          answer,
        });
        setCallStatus('connected');
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleWebRTCAnswer = async ({ answer }) => {
      try {
        await webrtcService.handleAnswer(answer);
        setCallStatus('connected');
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    };

    const handleICECandidate = async ({ candidate }) => {
      try {
        await webrtcService.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    setupCall();

    chatSocketClient.on('call_accepted', handleCallAccepted);
    chatSocketClient.on('call_rejected', handleCallRejected);
    chatSocketClient.on('call_ended', handleCallEnded);
    chatSocketClient.on('webrtc_offer', handleWebRTCOffer);
    chatSocketClient.on('webrtc_answer', handleWebRTCAnswer);
    chatSocketClient.on('webrtc_ice_candidate', handleICECandidate);

    return () => {
      chatSocketClient.offAll('call_accepted');
      chatSocketClient.offAll('call_rejected');
      chatSocketClient.offAll('call_ended');
      chatSocketClient.offAll('webrtc_offer');
      chatSocketClient.offAll('webrtc_answer');
      chatSocketClient.offAll('webrtc_ice_candidate');
      webrtcService.closeConnection();
    };
  }, [visible, callType, targetUserId, isIncoming, callerId, onClose]);

  const handleAcceptCall = async () => {
    chatSocketClient.emit('call_accepted', { callerId });
    setCallStatus('connecting');
  };

  const handleRejectCall = () => {
    chatSocketClient.emit('call_rejected', { callerId });
    onClose();
  };

  const handleEndCall = () => {
    chatSocketClient.emit('call_ended', {
      targetUserId: isIncoming ? callerId : targetUserId,
    });
    onClose();
  };

  const toggleAudio = () => {
    const newState = !audioEnabled;
    webrtcService.toggleAudio(newState);
    setAudioEnabled(newState);
  };

  const toggleVideo = () => {
    const newState = !videoEnabled;
    webrtcService.toggleVideo(newState);
    setVideoEnabled(newState);
  };

  return (
    <Modal
      open={visible}
      onCancel={handleEndCall}
      footer={null}
      width={800}
      centered
      closable={false}
    >
      <div style={{ textAlign: 'center' }}>
        <h2>{targetUserName || 'User'}</h2>
        <p>{callStatus === 'incoming' ? 'Incoming call...' : callStatus === 'connecting' ? 'Connecting...' : 'Connected'}</p>

        <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: 400, objectFit: 'cover' }}
          />
          {callType === 'video' && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                width: 150,
                height: 100,
                objectFit: 'cover',
                borderRadius: 8,
                border: '2px solid white',
              }}
            />
          )}
        </div>

        <Space size="large">
          {callStatus === 'incoming' ? (
            <>
              <Button
                type="primary"
                icon={<PhoneOutlined />}
                size="large"
                onClick={handleAcceptCall}
                style={{ background: '#52c41a' }}
              >
                Accept
              </Button>
              <Button
                danger
                icon={<PhoneOutlined />}
                size="large"
                onClick={handleRejectCall}
              >
                Reject
              </Button>
            </>
          ) : (
            <>
              <Button
                type={audioEnabled ? 'primary' : 'default'}
                icon={audioEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
                size="large"
                onClick={toggleAudio}
              />
              {callType === 'video' && (
                <Button
                  type={videoEnabled ? 'primary' : 'default'}
                  icon={videoEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
                  size="large"
                  onClick={toggleVideo}
                />
              )}
              <Button
                danger
                icon={<PhoneOutlined />}
                size="large"
                onClick={handleEndCall}
              >
                End Call
              </Button>
            </>
          )}
        </Space>
      </div>
    </Modal>
  );
}
