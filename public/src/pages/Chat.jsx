import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import Stories from "../components/Stories";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [showStories, setShowStories] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        try {
          const userData = JSON.parse(
            localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
          );
          setCurrentUser(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          localStorage.removeItem(process.env.REACT_APP_LOCALHOST_KEY);
          navigate("/login");
        }
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      // Socket.IO temporarily disabled for serverless deployment
      // socket.current = io(host);
      // socket.current.emit("add-user", currentUser._id);
      console.log("Socket.IO disabled - using HTTP polling for real-time features");
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        try {
          if (currentUser.isAvatarImageSet) {
            const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
            setContacts(data.data);
          } else {
            navigate("/setAvatar");
          }
        } catch (error) {
          console.error("Error fetching contacts:", error);
          // Handle error appropriately
        }
      }
    };

    fetchContacts();
  }, [currentUser, navigate]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };

  return (
    <>
      <Container>
        <div className="container">
          <Contacts contacts={contacts} changeChat={handleChatChange} />
          <div className="main-content">
            {/* Stories Section */}
            <div className="stories-section">
              <div className="stories-toggle">
                <button 
                  onClick={() => setShowStories(!showStories)}
                  className="stories-btn"
                >
                  {showStories ? '📱 Hide Stories' : '📱 Show Stories'}
                </button>
              </div>
              
              {showStories && (
                <Stories currentUser={currentUser} contacts={contacts} />
              )}
            </div>

            {/* Chat Section */}
            <div className="chat-section">
              {currentChat === undefined ? (
                <Welcome />
              ) : (
                <ChatContainer currentChat={currentChat} currentUser={currentUser} socket={socket} />
              )}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  
  .container {
    height: 90vh;
    width: 90vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }

  .main-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .stories-section {
    padding: 16px;
    border-bottom: 1px solid #ffffff1a;
    background: #00000040;

    .stories-toggle {
      text-align: center;
      margin-bottom: 16px;

      .stories-btn {
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
    }
  }

  .chat-section {
    flex: 1;
    overflow: hidden;
  }
`;
