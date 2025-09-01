import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import EmojiPicker from "emoji-picker-react";
import { validateMessage, sanitizeInput } from "../utils/validation";
import { 
  sendMessageRoute, 
  editMessageRoute, 
  deleteMessageRoute,
  addReactionRoute,
  generateUploadUrlRoute,
  uploadFileRoute,
  getMediaStatusRoute
} from "../utils/APIRoutes";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios"; // Added axios import

export default function ChatInput({ 
  handleSendMsg, 
  msg, 
  setMsg, 
  currentChat, 
  currentUser, 
  replyTo, 
  setReplyTo 
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messageType, setMessageType] = useState('text');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState("");
  
  // Media pipeline states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaStatus, setMediaStatus] = useState(null);
  const [mediaId, setMediaId] = useState(null);

  const fileInputRef = useRef();
  const typingTimeoutRef = useRef();
  const emojiPickerRef = useRef();

  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Typing indicator
  useEffect(() => {
    if (!currentUser?._id || !currentChat?._id) return;
    
    if (msg.length > 0) {
      if (!isTyping) {
        setIsTyping(true);
        // Emit typing event to other user
        if (window.socket && currentChat) {
          window.socket.emit("typing", {
            from: currentUser._id,
            to: currentChat._id,
            isTyping: true
          });
        }
      }

      // Clear typing indicator after 2 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (window.socket && currentChat) {
          window.socket.emit("typing", {
            from: currentUser._id,
            to: currentChat._id,
            isTyping: false
          });
        }
      }, 2000);
    } else {
      setIsTyping(false);
      if (window.socket && currentChat) {
        window.socket.emit("typing", {
          from: currentUser._id,
          to: currentChat._id,
          isTyping: false
        });
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [msg, currentChat, currentUser._id, isTyping]);

  // Early return if required props are missing - moved after all hooks
  if (!currentUser || !currentUser._id) {
    return (
      <Container>
        <div className="chat-input-container">
          <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
            Loading user data...
          </div>
        </div>
      </Container>
    );
  }

  const handleEmojiClick = (emojiObject) => {
    console.log('🎯 Emoji clicked:', emojiObject);
    const emoji = emojiObject.emoji;
    console.log('📝 Adding emoji to message:', emoji);
    console.log('📝 Current message before:', msg);
    
    setMsg(prev => {
      const newMsg = prev + emoji;
      console.log('✅ New message after adding emoji:', newMsg);
      return newMsg;
    });
    
    console.log('🔒 Closing emoji picker');
    setShowEmojiPicker(false);
    
    // Force a re-render to see the emoji
    setTimeout(() => {
      console.log('🔄 Message state after timeout:', msg);
    }, 100);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB", toastOptions);
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please select an image, video, audio, or document file.", toastOptions);
        return;
      }

      setMediaFile(file);
      setMessageType(file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : 
                    file.type.startsWith('audio/') ? 'audio' : 'document');

      // Create preview for images and videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => setMediaPreview(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  // Media pipeline functions
  const generateUploadUrl = async (file) => {
    try {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 
                      file.type.startsWith('audio/') ? 'audio' : 'document';
      
      const response = await axios.post(generateUploadUrlRoute, {
        userId: currentUser._id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileType: fileType
      });

      if (response.data.status) {
        return response.data.data;
      } else {
        throw new Error(response.data.msg || 'Failed to generate upload URL');
      }
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw error;
    }
  };

  const uploadMediaFile = async (file, uploadData) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(uploadData.uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${uploadData.uploadToken}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (response.data.status) {
        return response.data.data;
      } else {
        throw new Error(response.data.msg || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const checkMediaStatus = async (fileId) => {
    try {
      const response = await axios.get(`${getMediaStatusRoute}/${fileId}`);
      if (response.data.status) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error checking media status:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    try {
      if (!currentChat) {
        toast.error("Please select a chat first", toastOptions);
        return;
      }

      let messageData = {
        from: currentUser._id,
        to: currentChat._id,
        type: messageType,
        message: messageType === 'text' ? msg : undefined,
        replyTo: replyTo?._id
      };

      // Handle media upload
      if (messageType !== 'text' && mediaFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
          // Generate upload URL
          const uploadData = await generateUploadUrl(mediaFile);
          setMediaId(uploadData.fileId);
          
          // Upload file
          const uploadResult = await uploadMediaFile(mediaFile, uploadData);
          
          // Add media info to message
          messageData.media = {
            fileId: uploadResult.fileId,
            type: messageType,
            url: uploadResult.urls?.original || uploadResult.urls?.thumbnail,
            size: mediaFile.size,
            name: mediaFile.name
          };
          
          toast.success("Media uploaded successfully!", toastOptions);
          
        } catch (uploadError) {
          console.error('Media upload failed:', uploadError);
          toast.error("Media upload failed. Please try again.", toastOptions);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }

      // Validate message
      if (messageType === 'text') {
        const validation = validateMessage(msg);
        if (!validation.isValid) {
          setError(validation.error);
          return;
        }
        messageData.message = sanitizeInput(msg);
      }

      // Send message
      await handleSendMsg(messageData);

      // Reset form
      setMsg("");
      setMediaFile(null);
      setMediaPreview(null);
      setMessageType('text');
      setReplyTo(null);
      setError("");
      setShowEmojiPicker(false);
      setMediaId(null);
      setMediaStatus(null);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message", toastOptions);
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    try {
      const response = await fetch(editMessageRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          newText,
          userId: currentUser._id,
        }),
      });

      const data = await response.json();
      if (data.status) {
        toast.success("Message edited successfully", toastOptions);
        // Trigger message refresh
        if (window.socket) {
          window.socket.emit("message-edited", { messageId, newText });
        }
        setIsEditing(false);
        setEditText("");
      } else {
        toast.error(data.msg || "Failed to edit message", toastOptions);
      }
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message", toastOptions);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(deleteMessageRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          userId: currentUser._id,
        }),
      });

      const data = await response.json();
      if (data.status) {
        toast.success("Message deleted successfully", toastOptions);
        // Trigger message refresh
        if (window.socket) {
          window.socket.emit("message-deleted", { messageId });
        }
      } else {
        toast.error(data.msg || "Failed to delete message", toastOptions);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message", toastOptions);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(addReactionRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          userId: currentUser._id,
          emoji
        }),
      });

      const data = await response.json();
      if (data.status) {
        toast.success("Reaction added", toastOptions);
        // Trigger message refresh
        if (window.socket) {
          window.socket.emit("reaction-added", { messageId, emoji, userId: currentUser._id });
        }
      } else {
        toast.error(data.msg || "Failed to add reaction", toastOptions);
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction", toastOptions);
    }
  };

  const canSendMessage = () => {
    if (messageType === 'text') {
      return msg.trim().length > 0 && !error;
    }
    return mediaFile !== null && !isUploading;
  };

  return (
    <Container>
      <div className="chat-input-container">
        {/* Reply preview */}
        {replyTo && (
          <ReplyPreview>
            <span>Replying to: {replyTo.text || "Media message"}</span>
            <button onClick={() => setReplyTo(null)}>✕</button>
          </ReplyPreview>
        )}

        {/* Media preview */}
        {mediaPreview && (
          <MediaPreview>
            {messageType === 'image' && <img src={mediaPreview} alt="Preview" />}
            {messageType === 'video' && <video src={mediaPreview} controls />}
            <button onClick={() => {
              setMediaPreview(null);
              setMediaFile(null);
              setMessageType('text');
            }}>✕</button>
          </MediaPreview>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <UploadProgress>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">Uploading... {uploadProgress}%</span>
          </UploadProgress>
        )}

        {/* Main Input Box - Compact and Organized */}
        <div style={{ 
          background: '#ffffff0a', 
          border: '1px solid #ffffff1a',
          borderRadius: '12px', 
          padding: '6px',
          marginBottom: '2px'
        }}>
          {/* Message Type Selector */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <div style={{ color: '#ffffff80', fontSize: '12px' }}>
              Type: <span style={{ color: '#4e0eff', fontWeight: 'bold' }}>{messageType.toUpperCase()}</span>
            </div>
            <MessageTypeSelector>
              <button 
                className={messageType === 'text' ? 'active' : ''} 
                onClick={() => setMessageType('text')}
              >
                💬
              </button>
              <button 
                className={messageType === 'image' ? 'active' : ''} 
                onClick={() => fileInputRef.current?.click()}
              >
                🖼️
              </button>
              <button 
                className={messageType === 'video' ? 'active' : ''} 
                onClick={() => fileInputRef.current?.click()}
              >
                🎥
              </button>
              <button 
                className={messageType === 'audio' ? 'active' : ''} 
                onClick={() => fileInputRef.current?.click()}
              >
                🎵
              </button>
              <button 
                className={messageType === 'document' ? 'active' : ''} 
                onClick={() => fileInputRef.current?.click()}
              >
                📄
              </button>
            </MessageTypeSelector>
          </div>

          {/* Text Input Field */}
          <div style={{ 
            background: '#ffffff', 
            border: '2px solid #4e0eff', 
            borderRadius: '8px', 
            padding: '6px',
            marginBottom: '6px'
          }}>
            <input
              type="text"
              placeholder="Type your message here..."
              value={msg || ""}
              onChange={(e) => {
                setMsg(e.target.value);
                setError("");
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && canSendMessage()) {
                  handleSendMessage();
                }
              }}
              style={{ 
                width: '100%',
                height: '32px',
                background: 'transparent',
                border: 'none',
                color: '#000000',
                fontSize: '16px',
                outline: 'none',
                padding: '0 6px'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative' }}>
              <button
                className="emoji-picker-btn"
                onClick={() => {
                  console.log('🎯 Emoji button clicked!');
                  console.log('🎯 Current showEmojiPicker state:', showEmojiPicker);
                  setShowEmojiPicker(!showEmojiPicker);
                  console.log('🎯 New showEmojiPicker state will be:', !showEmojiPicker);
                }}
                style={{
                  background: showEmojiPicker ? '#4e0eff' : 'transparent',
                  border: showEmojiPicker ? '1px solid #4e0eff' : '1px solid #ffffff3a',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  minWidth: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="Add emoji"
              >
                {showEmojiPicker ? '😊' : '😊'}
              </button>
              
              {/* Quick test emoji button */}
              <button
                onClick={() => handleEmojiClick({ emoji: '😊' })}
                style={{
                  background: '#4e0eff',
                  border: 'none',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}
                title="Quick test emoji"
              >
                😊 Quick
              </button>
              
              {/* Emoji picker positioned relative to this container */}
              {showEmojiPicker && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '0',
                  zIndex: 1000,
                  marginBottom: '10px',
                  background: '#1e1b4b',
                  border: '1px solid #4e0eff',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                  minWidth: '300px'
                }}>
                  {/* Debug info */}
                  <div style={{
                    background: '#ff4444',
                    color: 'white',
                    padding: '8px',
                    fontSize: '12px',
                    marginBottom: '8px',
                    borderRadius: '4px'
                  }}>
                    🐛 Emoji Picker is OPEN! showEmojiPicker = {showEmojiPicker.toString()}
                  </div>
                  
                  {/* Simple emoji grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '8px',
                    maxWidth: '280px'
                  }}>
                    {['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '😎', '🤔', '😢', '😡', '😴', '🥳', '🤩', '😇', '😋', '🤗', '😴', '😭', '😤', '😵', '🤯', '😱', '😨', '😰', '😥', '😓', '😪', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          console.log('🎯 Emoji clicked:', emoji);
                          handleEmojiClick({ emoji });
                          setShowEmojiPicker(false);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '20px',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '32px',
                          height: '32px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#ffffff1a';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  
                  {/* Close button */}
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      style={{
                        background: '#ff4444',
                        border: 'none',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!canSendMessage()}
              style={{
                background: '#4e0eff',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isUploading ? '⏳ Uploading...' : '📤 Send'}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />

        {/* Error display */}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Emoji picker */}
        {/* This block is now redundant as the picker is positioned relative to the button */}
        {/* {showEmojiPicker && (
          <div ref={emojiPickerRef} style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            zIndex: 1000,
            marginBottom: '10px'
          }}>
            {/* Try to render the main emoji picker with error boundary */}
            {/* <div style={{ marginBottom: '10px' }}>
              {(() => {
                try {
                  return (
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={300}
                      height={400}
                      searchDisabled={false}
                      skinTonesDisabled={false}
                      emojiStyle="native"
                    />
                  );
                } catch (error) {
                  console.error('Emoji picker error:', error);
                  return (
                    <div style={{
                      background: '#ff4444',
                      color: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      Emoji picker failed to load. Using fallback.
                    </div>
                  );
                }
              })()}
            </div>
            
            {/* Simple fallback emoji picker */}
            {/* <div style={{
              background: '#1e1b4b',
              border: '1px solid #4e0eff',
              borderRadius: '12px',
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '8px',
              maxWidth: '320px'
            }}>
              {['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '😎', '🤔', '😢', '😡', '😴', '🥳', '🤩', '😇', '😋', '🤗', '😴', '😭', '😤', '😵', '🤯', '😱', '😨', '😰', '😥', '😓', '😪', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleEmojiClick({ emoji });
                    setShowEmojiPicker(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    height: '32px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ffffff1a';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )} */}
      </div>
      <ToastContainer />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #080420;
  padding: 0.2rem;
  width: 100%;
  height: auto;
  overflow: visible;
  
  .chat-input-container {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    width: 100%;
    height: auto;
    min-height: 120px;
  }
`;

const ReplyPreview = styled.div`
  background: #ffffff0d;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
    align-items: center;
  font-size: 14px;
  color: #ffffff;
  
  button {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    font-size: 16px;
    
    &:hover {
      color: #ff6b6b;
    }
  }
`;

const MediaPreview = styled.div`
  position: relative;
  margin-bottom: 8px;
  
  img, video {
    max-width: 200px;
    max-height: 150px;
    border-radius: 8px;
  }
  
  button {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff6b6b;
    border: none;
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
        cursor: pointer;
    font-size: 12px;
    
    &:hover {
      background: #ff5252;
    }
  }
`;

const UploadProgress = styled.div`
  background: #ffffff0d;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #ffffff1a;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  
  .progress-fill {
    height: 100%;
    background: #4e0eff;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    color: #ffffff;
    font-size: 12px;
  }
`;

const MessageTypeSelector = styled.div`
  display: flex;
  gap: 4px;
  
          button {
    background: #ffffff0d;
    border: 1px solid #ffffff1a;
    color: #ffffff;
    padding: 4px 6px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #ffffff1a;
    }
    
    &.active {
      background: #4e0eff;
      border-color: #4e0eff;
    }
  }
`;

const InputArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background-color: #ffffff20;
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  min-height: 3rem;
  
  .emoji-picker-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
      border: none;
    font-size: 1.5rem;
    color: #fffffc;
    cursor: pointer;
    transition: 0.3s ease-in-out;
    flex-shrink: 0;
    
    &:hover {
      color: #4e0eff;
    }
  }
  
  .send-btn {
      display: flex;
    align-items: center;
      justify-content: center;
    background: #4e0eff;
      border: none;
    color: white;
    cursor: pointer;
    transition: 0.3s ease-in-out;
    flex-shrink: 0;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    
    &:hover {
      background: #3a0bff;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #666;
      
      &:hover {
        background: #666;
      }
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
`;

const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  z-index: 1000;
`;

const ReactionPicker = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  background: #1e1b4b;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  gap: 4px;
  z-index: 1000;
  
  button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background: #ffffff1a;
    }
  }
`;
