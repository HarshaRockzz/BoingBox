import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  createStoryRoute, 
  getUserStoriesRoute, 
  getAllStoriesRoute,
  viewStoryRoute,
  replyToStoryRoute,
  deleteStoryRoute
} from '../utils/APIRoutes';

export default function Stories({ currentUser, contacts }) {
  const [stories, setStories] = useState([]);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [storyType, setStoryType] = useState('text');
  const [storyFile, setStoryFile] = useState(null);
  const [storyPreview, setStoryPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);

  const toastOptions = {
    position: "bottom-right",
    autoClose: 3000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  useEffect(() => {
    if (currentUser) {
      fetchStories();
    }
  }, [currentUser]);

  const fetchStories = async () => {
    try {
      const response = await axios.get(`${getAllStoriesRoute}/${currentUser._id}`);
      if (response.data.status) {
        setStories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB", toastOptions);
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      
      if (!validTypes.includes(file.type)) {
        toast.error("Please select an image or video file", toastOptions);
        return;
      }

      setStoryFile(file);
      setStoryType(file.type.startsWith('image/') ? 'image' : 'video');

      const reader = new FileReader();
      reader.onload = (e) => setStoryPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStory = async () => {
    if (!storyContent.trim() && !storyFile) {
      toast.error("Please add some content to your story", toastOptions);
      return;
    }

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('userId', currentUser._id);
      formData.append('type', storyType);
      
      if (storyType === 'text') {
        formData.append('content', storyContent);
      } else if (storyFile) {
        formData.append('media', storyFile);
      }

      const response = await axios.post(createStoryRoute, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status) {
        toast.success("Story created successfully!", toastOptions);
        setShowCreateStory(false);
        setStoryContent('');
        setStoryFile(null);
        setStoryPreview(null);
        setStoryType('text');
        fetchStories();
      } else {
        toast.error(response.data.msg || "Failed to create story", toastOptions);
      }
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error("Failed to create story", toastOptions);
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewStory = async (story) => {
    try {
      await axios.post(viewStoryRoute, {
        storyId: story._id,
        userId: currentUser._id
      });
      setSelectedStory(story);
      setShowStoryViewer(true);
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      const response = await axios.delete(`${deleteStoryRoute}/${storyId}`);
      if (response.data.status) {
        toast.success("Story deleted successfully!", toastOptions);
        fetchStories();
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error("Failed to delete story", toastOptions);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const storyTime = new Date(timestamp);
    const diffInHours = Math.floor((now - storyTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return 'Expired';
  };

  const isStoryExpired = (timestamp) => {
    const now = new Date();
    const storyTime = new Date(timestamp);
    const diffInHours = (now - storyTime) / (1000 * 60 * 60);
    return diffInHours >= 24;
  };

  return (
    <Container>
      {/* Stories Header */}
      <StoriesHeader>
        <h3>📱 Stories</h3>
        <button 
          onClick={() => setShowCreateStory(!showCreateStory)}
          className="create-story-btn"
        >
          {showCreateStory ? '✕' : '➕ Create Story'}
        </button>
      </StoriesHeader>

      {/* Create Story Form */}
      {showCreateStory && (
        <CreateStoryForm>
          <h4>Create New Story</h4>
          
          <div className="story-type-selector">
            <button
              className={storyType === 'text' ? 'active' : ''}
              onClick={() => setStoryType('text')}
            >
              📝 Text
            </button>
            <button
              className={storyType === 'image' ? 'active' : ''}
              onClick={() => {
                setStoryType('image');
                document.getElementById('story-file-input').click();
              }}
            >
              🖼️ Image
            </button>
            <button
              className={storyType === 'video' ? 'active' : ''}
              onClick={() => {
                setStoryType('video');
                document.getElementById('story-file-input').click();
              }}
            >
              🎥 Video
            </button>
          </div>

          {storyType === 'text' && (
            <textarea
              placeholder="What's on your mind?"
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              maxLength={500}
            />
          )}

          {(storyType === 'image' || storyType === 'video') && storyPreview && (
            <div className="story-preview">
              {storyType === 'image' ? (
                <img src={storyPreview} alt="Story preview" />
              ) : (
                <video src={storyPreview} controls />
              )}
              <button 
                onClick={() => {
                  setStoryPreview(null);
                  setStoryFile(null);
                }}
                className="remove-preview"
              >
                ✕
              </button>
            </div>
          )}

          <input
            id="story-file-input"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <div className="story-actions">
            <button
              onClick={handleCreateStory}
              disabled={isCreating || (!storyContent.trim() && !storyFile)}
              className="create-btn"
            >
              {isCreating ? 'Creating...' : 'Create Story'}
            </button>
            <button
              onClick={() => {
                setShowCreateStory(false);
                setStoryContent('');
                setStoryFile(null);
                setStoryPreview(null);
                setStoryType('text');
              }}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </CreateStoryForm>
      )}

      {/* Stories List */}
      <StoriesList>
        {stories.length === 0 ? (
          <div className="no-stories">
            <p>No stories yet. Be the first to share!</p>
          </div>
        ) : (
          stories.map((story) => (
            <StoryItem 
              key={story._id} 
              onClick={() => handleViewStory(story)}
              className={isStoryExpired(story.createdAt) ? 'expired' : ''}
            >
              <div className="story-avatar">
                {story.user?.avatarImage ? (
                  <img src={story.user.avatarImage} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {story.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              
              <div className="story-content">
                <div className="story-header">
                  <span className="username">{story.user?.username || 'Unknown'}</span>
                  <span className="time">{formatTimeAgo(story.createdAt)}</span>
                </div>
                
                <div className="story-preview">
                  {story.type === 'text' ? (
                    <p>{story.content}</p>
                  ) : story.type === 'image' ? (
                    <span>🖼️ Image Story</span>
                  ) : (
                    <span>🎥 Video Story</span>
                  )}
                </div>

                {story.user?._id === currentUser?._id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStory(story._id);
                    }}
                    className="delete-btn"
                    title="Delete story"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </StoryItem>
          ))
        )}
      </StoriesList>

      {/* Story Viewer Modal */}
      {showStoryViewer && selectedStory && (
        <StoryViewer>
          <div className="story-viewer-content">
            <div className="story-viewer-header">
              <span className="username">{selectedStory.user?.username || 'Unknown'}</span>
              <button 
                onClick={() => setShowStoryViewer(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="story-content">
              {selectedStory.type === 'text' ? (
                <div className="text-story">
                  <p>{selectedStory.content}</p>
                </div>
              ) : selectedStory.type === 'image' ? (
                <img src={selectedStory.content} alt="Story" />
              ) : (
                <video src={selectedStory.content} controls autoPlay />
              )}
            </div>

            <div className="story-footer">
              <span className="time">{formatTimeAgo(selectedStory.createdAt)}</span>
              <span className="views">{selectedStory.views?.length || 0} views</span>
            </div>
          </div>
        </StoryViewer>
      )}
    </Container>
  );
}

const Container = styled.div`
  background: #ffffff0a;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #ffffff1a;
`;

const StoriesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    color: #ffffff;
    margin: 0;
    font-size: 18px;
  }

  .create-story-btn {
    background: #4e0eff;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;

    &:hover {
      background: #3a0bff;
    }
  }
`;

const CreateStoryForm = styled.div`
  background: #1e1b4b;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #4e0eff;

  h4 {
    color: #ffffff;
    margin: 0 0 16px 0;
    text-align: center;
  }

  .story-type-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;

    button {
      flex: 1;
      background: transparent;
      border: 1px solid #ffffff3a;
      color: #ffffff;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #4e0eff;
      }

      &.active {
        background: #4e0eff;
        border-color: #4e0eff;
      }
    }
  }

  textarea {
    width: 100%;
    min-height: 100px;
    background: #ffffff0a;
    border: 1px solid #ffffff3a;
    border-radius: 8px;
    padding: 12px;
    color: #ffffff;
    font-size: 14px;
    resize: vertical;
    margin-bottom: 16px;

    &::placeholder {
      color: #ffffff80;
    }

    &:focus {
      outline: none;
      border-color: #4e0eff;
    }
  }

  .story-preview {
    position: relative;
    margin-bottom: 16px;
    text-align: center;

    img, video {
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
    }

    .remove-preview {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #ff4444;
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
    }
  }

  .story-actions {
    display: flex;
    gap: 12px;

    button {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: all 0.2s ease;

      &.create-btn {
        background: #4e0eff;
        color: white;

        &:hover:not(:disabled) {
          background: #3a0bff;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.cancel-btn {
        background: #666;
        color: white;

        &:hover {
          background: #555;
        }
      }
    }
  }
`;

const StoriesList = styled.div`
  .no-stories {
    text-align: center;
    color: #ffffff80;
    padding: 32px 16px;
  }
`;

const StoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #ffffff0a;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #ffffff1a;

  &:hover {
    background: #ffffff1a;
    border-color: #4e0eff;
  }

  &.expired {
    opacity: 0.5;
    background: #333;
  }

  .story-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: #4e0eff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
    }
  }

  .story-content {
    flex: 1;
    min-width: 0;

    .story-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .username {
        color: #ffffff;
        font-weight: bold;
        font-size: 14px;
      }

      .time {
        color: #ffffff80;
        font-size: 12px;
      }
    }

    .story-preview {
      color: #ffffffcc;
      font-size: 13px;

      p {
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .delete-btn {
      background: #ff4444;
      border: none;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 4px;

      &:hover {
        background: #cc3333;
      }
    }
  }
`;

const StoryViewer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;

  .story-viewer-content {
    background: #1e1b4b;
    border-radius: 16px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    position: relative;

    .story-viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #00000080;
      border-bottom: 1px solid #ffffff1a;

      .username {
        color: #ffffff;
        font-weight: bold;
        font-size: 16px;
      }

      .close-btn {
        background: #ff4444;
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;

        &:hover {
          background: #cc3333;
        }
      }
    }

    .story-content {
      padding: 20px;
      text-align: center;

      .text-story {
        p {
          color: #ffffff;
          font-size: 18px;
          line-height: 1.6;
          margin: 0;
        }
      }

      img, video {
        max-width: 100%;
        max-height: 60vh;
        border-radius: 8px;
      }
    }

    .story-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #00000080;
      border-top: 1px solid #ffffff1a;
      color: #ffffff80;
      font-size: 14px;
    }
  }
`;
