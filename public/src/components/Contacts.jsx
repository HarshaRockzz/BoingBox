import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logo from "./Logo";
import Avatar from "./Avatar";

export default function Contacts({ contacts, changeChat }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentUserImage, setCurrentUserImage] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);

  useEffect(() => {
    const fetchData = () => {
      const storedData = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          if (data && data.username && data.avatarImage) {
            setCurrentUserName(data.username);
            setCurrentUserImage(data.avatarImage);
          }
        } catch (error) {
          // Silently handle parsing errors
        }
      }
    };

    fetchData();
  }, []);

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

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

  // Don't render if we don't have user data
  if (!currentUserImage || !currentUserName) {
    return null;
  }

  return (
    <>
      <Container>
        <div className="brand">
          <Logo size="small" />
        </div>
        <div className="contacts">
          {contacts.map((contact, index) => {
            return (
              <div
                key={contact._id}
                className={`contact ${
                  index === currentSelected ? "selected" : ""
                }`}
                onClick={() => changeCurrentChat(index, contact)}
              >
                <div className="avatar">
                  <Avatar 
                    src={getAvatarSource(contact.avatarImage)}
                    alt={contact.username}
                    size="small"
                    fallbackText={contact.username.charAt(0).toUpperCase()}
                  />
                </div>
                <div className="username">
                  <h3>{contact.username}</h3>
                </div>
              </div>
            );
          })}
        </div>
        <div className="current-user">
          <div className="avatar">
            <Avatar 
              src={getAvatarSource(currentUserImage)}
              alt={currentUserName}
              size="medium"
              fallbackText={currentUserName.charAt(0).toUpperCase()}
            />
          </div>
          <div className="username">
            <h2>{currentUserName}</h2>
          </div>
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #080420;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 5rem;
      cursor: pointer;
      width: 90%;
      border-radius: 0.2rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
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
    .selected {
      background-color: #9a86f3;
    }
  }

  .current-user {
    background-color: #0d0d30;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    .avatar {
      img {
        height: 4rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;
