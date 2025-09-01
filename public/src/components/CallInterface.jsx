import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaVolumeUp, FaVolumeMute } from "react-icons/fa";

const CallInterface = ({ 
  isVisible, 
  callType, 
  participants, 
  onEndCall, 
  onToggleMute, 
  onToggleVideo, 
  onToggleScreenShare,
  onToggleSpeaker,
  socket,
  currentUser 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [peerConnections, setPeerConnections] = useState(new Map());
  
  const localVideoRef = useRef();
  const remoteVideoRefs = useRef(new Map());
  const durationIntervalRef = useRef();
  const peerConnectionRef = useRef();

  useEffect(() => {
    if (isVisible) {
      initializeCall();
      startDurationTimer();
    } else {
      cleanupCall();
    }

    return () => {
      cleanupCall();
    };
  }, [isVisible]);

  useEffect(() => {
    if (socket) {
      setupSocketListeners();
    }
  }, [socket]);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connections for each participant
      participants.forEach(participant => {
        if (participant.user._id !== currentUser._id) {
          createPeerConnection(participant.user._id);
        }
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const createPeerConnection = (participantId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming streams
    pc.ontrack = (event) => {
      setRemoteStreams(prev => new Map(prev.set(participantId, event.streams[0])));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call-ice-candidate', {
          from: currentUser._id,
          to: participantId,
          candidate: event.candidate
        });
      }
    };

    setPeerConnections(prev => new Map(prev.set(participantId, pc)));
  };

  const setupSocketListeners = () => {
    socket.on('call-ice-candidate', handleIceCandidate);
    socket.on('call-offer', handleCallOffer);
    socket.on('call-answer-sdp', handleCallAnswer);
  };

  const handleIceCandidate = async (data) => {
    const pc = peerConnections.get(data.from);
    if (pc) {
      try {
        await pc.addIceCandidate(data.candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    }
  };

  const handleCallOffer = async (data) => {
    const pc = peerConnections.get(data.from);
    if (pc) {
      try {
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('call-answer-sdp', {
          from: currentUser._id,
          to: data.from,
          answer: answer
        });
      } catch (error) {
        console.error("Error handling call offer:", error);
      }
    }
  };

  const handleCallAnswer = async (data) => {
    const pc = peerConnections.get(data.from);
    if (pc) {
      try {
        await pc.setRemoteDescription(data.answer);
      } catch (error) {
        console.error("Error handling call answer:", error);
      }
    }
  };

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanupCall = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    peerConnections.forEach(pc => pc.close());
    setPeerConnections(new Map());
    setRemoteStreams(new Map());
    setLocalStream(null);
  };

  const handleToggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        onToggleMute && onToggleMute(!audioTrack.enabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        onToggleVideo && onToggleVideo(!videoTrack.enabled);
      }
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnections.values().next().value?.getSenders()
          .find(s => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(true);
        onToggleScreenShare && onToggleScreenShare(true);
      } else {
        // Restore camera video
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = peerConnections.values().next().value?.getSenders()
          .find(s => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(false);
        onToggleScreenShare && onToggleScreenShare(false);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    onToggleSpeaker && onToggleSpeaker(!isSpeakerOn);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <CallContainer>
      <CallHeader>
        <CallInfo>
          <CallType>{callType === 'video' ? '📹' : '📞'} {callType.toUpperCase()} Call</CallType>
          <CallDuration>{formatDuration(callDuration)}</CallDuration>
        </CallInfo>
        <ParticipantCount>{participants.length} participants</ParticipantCount>
      </CallHeader>

      <VideoContainer>
        {callType === 'video' && (
          <>
            <LocalVideo ref={localVideoRef} autoPlay muted />
            {Array.from(remoteStreams.entries()).map(([participantId, stream]) => (
              <RemoteVideo
                key={participantId}
                ref={el => {
                  if (el) {
                    el.srcObject = stream;
                    remoteVideoRefs.current.set(participantId, el);
                  }
                }}
                autoPlay
              />
            ))}
          </>
        )}
      </VideoContainer>

      <CallControls>
        <ControlButton
          onClick={handleToggleMute}
          isActive={!isMuted}
          danger={isMuted}
        >
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </ControlButton>

        {callType === 'video' && (
          <ControlButton
            onClick={handleToggleVideo}
            isActive={!isVideoOff}
            danger={isVideoOff}
          >
            {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
          </ControlButton>
        )}

        <ControlButton
          onClick={handleToggleScreenShare}
          isActive={!isScreenSharing}
        >
          {isScreenSharing ? <FaDesktop /> : <FaDesktop />}
        </ControlButton>

        <ControlButton
          onClick={handleToggleSpeaker}
          isActive={isSpeakerOn}
        >
          {isSpeakerOn ? <FaVolumeUp /> : <FaVolumeMute />}
        </ControlButton>

        <EndCallButton onClick={onEndCall}>
          <FaPhoneSlash />
        </EndCallButton>
      </CallControls>

      <ParticipantsList>
        {participants.map(participant => (
          <ParticipantItem key={participant.user._id}>
            <ParticipantAvatar src={participant.user.avatarImage} />
            <ParticipantName>{participant.user.username}</ParticipantName>
            <ParticipantStatus>
              {participant.isActive ? '🟢' : '🔴'} {participant.isActive ? 'Connected' : 'Disconnected'}
            </ParticipantStatus>
          </ParticipantItem>
        ))}
      </ParticipantsList>
    </CallContainer>
  );
};

const CallContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  color: white;
`;

const CallHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
`;

const CallInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CallType = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
`;

const CallDuration = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const ParticipantCount = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const VideoContainer = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
`;

const LocalVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  background: #000;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  background: #000;
`;

const CallControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.3);
`;

const ControlButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: ${props => props.danger ? '#ef4444' : props.isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
    background: ${props => props.danger ? '#dc2626' : props.isActive ? '#2563eb' : 'rgba(255, 255, 255, 0.3)'};
  }
`;

const EndCallButton = styled(ControlButton)`
  background: #ef4444;
  width: 70px;
  height: 70px;
  font-size: 1.4rem;

  &:hover {
    background: #dc2626;
  }
`;

const ParticipantsList = styled.div`
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  max-height: 150px;
  overflow-y: auto;
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

const ParticipantAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const ParticipantName = styled.div`
  font-weight: 500;
  flex: 1;
`;

const ParticipantStatus = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
`;

export default CallInterface;
