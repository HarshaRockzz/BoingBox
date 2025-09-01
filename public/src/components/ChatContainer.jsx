import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import Avatar from "./Avatar";
import CallInterface from "./CallInterface";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, receiveMessageRoute, initiateCallRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, currentUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);

  // Call state management
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState('voice');
  const [callParticipants, setCallParticipants] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);

  // Helper function to determine avatar source
  const getAvatarSource = (avatarData) => {
    if (!avatarData) return null;
    
    // Check if it's a base64 encoded image
    if (avatarData.startsWith('data:image/') || avatarData.startsWith('/9j/') || avatarData.startsWith('iVBOR')) {
      return `data:image/svg+xml;base64,${avatarData}`;
    }
    
    // Check if it's already a full URL
    if (avatarData.startsWith('http://') || avatarData.startsWith('https://')) {
      return avatarData;
    }
    
    // Assume it's base64 data
    return `data:image/svg+xml;base64,${avatarData}`;
  };

  // Call management functions
  const initiateCall = async (type) => {
    try {
      if (!currentChat || !currentUser) return;
      
      const participants = [
        { user: currentUser, isActive: true },
        { user: currentChat, isActive: true }
      ];
      
      setCallParticipants(participants);
      setCallType(type);
      setIsCallActive(true);
      
      // Emit call request via socket
      socket.current.emit("call-request", {
        from: currentUser._id,
      to: currentChat._id,
        type: type,
        participants: participants.map(p => p.user._id)
      });
      
      // Create call record in backend
      await axios.post(initiateCallRoute, {
        initiator: currentUser._id,
        participants: [currentUser._id, currentChat._id],
        type: type,
        settings: {
          isMuted: false,
          isVideoOff: type === 'voice',
          isScreenSharing: false
        }
      });
      
    } catch (error) {
      console.error("Error initiating call:", error);
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallParticipants([]);
    setCallType('voice');
    
    // Emit call end via socket
    if (socket.current) {
      socket.current.emit("call-end", {
        from: currentUser._id,
        to: currentChat._id
      });
    }
  };

  const handleIncomingCall = (callData) => {
    setIncomingCall(callData);
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    
    setCallParticipants([
      { user: incomingCall.from, isActive: true },
      { user: currentUser, isActive: true }
    ]);
    setCallType(incomingCall.type);
    setIsCallActive(true);
    setIncomingCall(null);
    
    // Emit call accepted
    socket.current.emit("call-accepted", {
      from: currentUser._id,
      to: incomingCall.from._id,
      type: incomingCall.type
    });
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    
    // Emit call rejected
    socket.current.emit("call-rejected", {
      from: currentUser._id,
      to: incomingCall.from._id
    });
    
    setIncomingCall(null);
  };

  // Socket event listeners for calls
  useEffect(() => {
    if (socket.current) {
      // Incoming call
      socket.current.on("incoming-call", handleIncomingCall);
      
      // Call accepted
      socket.current.on("call-accepted", (data) => {
        console.log("Call accepted by:", data.from);
      });
      
      // Call rejected
      socket.current.on("call-rejected", (data) => {
        console.log("Call rejected by:", data.from);
        if (isCallActive) {
          endCall();
        }
      });
      
      // Call ended by other party
      socket.current.on("call-ended", (data) => {
        console.log("Call ended by:", data.from);
        if (isCallActive) {
          endCall();
        }
      });
    }

    return () => {
      if (socket.current) {
        socket.current.off("incoming-call");
        socket.current.off("call-accepted");
        socket.current.off("call-rejected");
        socket.current.off("call-ended");
      }
    };
  }, [socket, isCallActive]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!currentUser?._id) {
          console.error("No current user available");
          return;
        }
        
        const response = await axios.post(receiveMessageRoute, {
          from: currentUser._id,
          to: currentChat._id,
        });
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (currentChat && currentUser) {
      fetchMessages();
    }
  }, [currentChat, currentUser]);

  const handleSendMsg = async (msgData) => {
    try {
      if (!currentUser?._id) {
        console.error("No current user available");
        return;
      }
      
      // Handle both old and new message formats
      let messageText;
      if (typeof msgData === 'string') {
        // Old format: direct string
        messageText = msgData;
      } else if (msgData.message) {
        // New format: object with message property
        messageText = msgData.message;
      } else {
        console.error("Invalid message format:", msgData);
        return;
      }
      
      // Emit socket event
    socket.current.emit("send-msg", {
      to: currentChat._id,
        from: currentUser._id,
        msg: messageText,
    });
      
      // Send to backend
    await axios.post(sendMessageRoute, {
        from: currentUser._id,
      to: currentChat._id,
        message: messageText,
    });

      // Add to local messages
    const msgs = [...messages];
      msgs.push({ fromSelf: true, message: messageText });
    setMessages(msgs);
      
      // Clear the message input
      setMsg("");
      
      console.log("Message sent successfully:", messageText);
      console.log("Updated messages:", msgs);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-receive", (msg) => {
        setArrivalMessage({ fromSelf: false, message: msg });
      });
    }

    return () => {
      if (socket.current) {
        socket.current.off("msg-receive");
      }
    };
  }, [socket]);

  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prev) => [...prev, arrivalMessage]);
      setArrivalMessage(null);
    }
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal>
          <IncomingCallContent>
            <div className="caller-info">
              <Avatar 
                src={getAvatarSource(incomingCall.from.avatarImage)}
                alt={incomingCall.from.username}
                size="large"
                fallbackText={incomingCall.from.username.charAt(0).toUpperCase()}
              />
              <h3>{incomingCall.from.username}</h3>
              <p>{incomingCall.type === 'video' ? '📹 Video Call' : '📞 Voice Call'}</p>
            </div>
            <div className="call-actions">
              <AcceptCallButton onClick={acceptCall}>
                📞 Accept
              </AcceptCallButton>
              <RejectCallButton onClick={rejectCall}>
                ❌ Decline
              </RejectCallButton>
            </div>
          </IncomingCallContent>
        </IncomingCallModal>
      )}

      {/* Call Interface */}
      {isCallActive && (
        <CallInterface
          isVisible={isCallActive}
          callType={callType}
          participants={callParticipants}
          onEndCall={endCall}
          onToggleMute={() => {}}
          onToggleVideo={() => {}}
          onToggleScreenShare={() => {}}
          onToggleSpeaker={() => {}}
          socket={socket.current}
          currentUser={currentUser}
        />
      )}

      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <Avatar 
              src={getAvatarSource(currentChat.avatarImage)}
              alt={currentChat.username}
              size="small"
              fallbackText={currentChat.username.charAt(0).toUpperCase()}
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
            <small style={{ color: '#ffffff80', fontSize: '12px' }}>
              Messages: {messages.length}
            </small>
          </div>
        </div>
        
        {/* Call Buttons */}
        <div className="call-actions">
          <CallButton 
            onClick={() => initiateCall('voice')}
            disabled={isCallActive}
            title="Voice Call"
          >
            📞
          </CallButton>
          <CallButton 
            onClick={() => initiateCall('video')}
            disabled={isCallActive}
            title="Video Call"
          >
            📹
          </CallButton>
        <Logout />
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#ffffff80', 
            padding: '2rem',
            fontSize: '14px'
          }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => {
            console.log(`Rendering message ${index}:`, message);
          return (
              <div ref={index === messages.length - 1 ? scrollRef : null} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                  <div className="content">
                    {/* Media content */}
                    {message.media && (
                      <MediaContent>
                        <div className={`media-item ${message.media.type}`}>
                          {message.media.type === 'image' && (
                            <img src={message.media.url} alt="Image" />
                          )}
                          {message.media.type === 'video' && (
                            <video src={message.media.url} controls />
                          )}
                          {message.media.type === 'audio' && (
                            <audio src={message.media.url} controls />
                          )}
                          {message.media.type === 'document' && (
                            <>
                              <div className="doc-icon">📄</div>
                              <div className="doc-info">
                                <div className="doc-name">{message.media.name}</div>
                                <div className="doc-size">
                                  {(message.media.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </MediaContent>
                    )}
                    
                    {/* Text content */}
                    {message.message && (
                  <p>{message.message}</p>
                    )}
                    
                    {/* Message metadata */}
                    <MessageMeta>
                      <span className="time">
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ''}
                      </span>
                      {message.fromSelf && (
                        <span className="status">
                          {message.readBy?.includes(currentChat._id) ? '✓✓' : '✓'}
                        </span>
                      )}
                    </MessageMeta>
                  </div>
              </div>
            </div>
          );
          })
        )}
      </div>
      <ChatInput 
        handleSendMsg={handleSendMsg} 
        msg={msg}
        setMsg={setMsg}
        currentUser={currentUser}
        currentChat={currentChat}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
      />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 12% 58% 30%;
  gap: 0.1rem;
  overflow: hidden;
  height: 100%;
  
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 12% 53% 35%;
  }
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    background-color: #080420;
    border-bottom: 1px solid #ffffff39;
    
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
    
    .call-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  }
  
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    background-color: #080420;
    
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;

const CallButton = styled.button`
  background: #4f46e5;
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: #3730a3;
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const IncomingCallModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IncomingCallContent = styled.div`
  background: #1e1b4b;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  color: white;
  
  .caller-info {
    margin-bottom: 2rem;
    
    h3 {
      margin: 1rem 0 0.5rem 0;
      font-size: 1.5rem;
    }
    
    p {
      margin: 0;
      opacity: 0.8;
      font-size: 1.1rem;
    }
  }
  
  .call-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
`;

const AcceptCallButton = styled.button`
  background: #10b981;
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  
  &:hover {
    background: #059669;
  }
`;

const RejectCallButton = styled.button`
  background: #ef4444;
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  
  &:hover {
    background: #dc2626;
  }
`;

const MediaContent = styled.div`
  margin-bottom: 0.5rem;
  
  .media-item {
    max-width: 100%;
    border-radius: 8px;
    overflow: hidden;
    
    &.image img {
      max-width: 200px;
      max-height: 200px;
      object-fit: cover;
    }
    
    &.video video {
      max-width: 300px;
      max-height: 200px;
      background: #000;
    }
    
    &.audio audio {
      width: 100%;
      max-width: 300px;
    }
    
    &.document {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      
      .doc-icon {
        font-size: 2rem;
        color: #4e0eff;
      }
      
      .doc-info {
        flex: 1;
        
        .doc-name {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        
        .doc-size {
          font-size: 0.8rem;
          opacity: 0.8;
        }
      }
    }
  }
`;

const MessageMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  opacity: 0.7;
  
  .time {
    color: inherit;
  }
  
  .status {
    color: #4e0eff;
    font-weight: bold;
  }
`;
