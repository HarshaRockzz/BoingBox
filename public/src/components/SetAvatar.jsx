import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { setAvatarRoute } from "../utils/APIRoutes";

export default function SetAvatar() {
  const navigate = useNavigate();
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(undefined);
  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  useEffect(() => {
    const checkAuth = () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  const setProfilePicture = async () => {
    if (selectedAvatar === undefined) {
      toast.error("Please select an avatar", toastOptions);
    } else {
      try {
        const user = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );

      const { data } = await axios.post(`${setAvatarRoute}/${user._id}`, {
        image: avatars[selectedAvatar],
      });

      if (data.isSet) {
        user.isAvatarImageSet = true;
        user.avatarImage = data.image;
        localStorage.setItem(
          process.env.REACT_APP_LOCALHOST_KEY,
          JSON.stringify(user)
        );
        navigate("/");
      } else {
          toast.error("Error setting avatar. Please try again.", toastOptions);
        }
      } catch (error) {
        console.error("Error setting avatar:", error);
        toast.error("Error setting avatar. Please try again.", toastOptions);
      }
    }
  };

  useEffect(() => {
    const generateAvatars = () => {
      try {
        console.log("🔄 Generating avatars...");
        
        // Generate simple SVG avatars directly
        const avatarSvgs = [];
        const colors = ['#4e0eff', '#997af0', '#9a86f3', '#4f04ff'];
        const shapes = ['circle', 'square', 'triangle', 'diamond'];
        
    for (let i = 0; i < 4; i++) {
          const color = colors[i];
          const shape = shapes[i];
          
          let svgContent = '';
          
          switch(shape) {
            case 'circle':
              svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" fill="${color}"/>
                <circle cx="40" cy="40" r="8" fill="white"/>
                <circle cx="60" cy="40" r="8" fill="white"/>
                <path d="M 35 60 Q 50 70 65 60" stroke="white" stroke-width="3" fill="none"/>
              </svg>`;
              break;
            case 'square':
              svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="60" height="60" fill="${color}"/>
                <circle cx="35" cy="35" r="5" fill="white"/>
                <circle cx="65" cy="35" r="5" fill="white"/>
                <rect x="30" y="55" width="40" height="5" fill="white" rx="2"/>
              </svg>`;
              break;
            case 'triangle':
              svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,20 20,80 80,80" fill="${color}"/>
                <circle cx="40" cy="50" r="4" fill="white"/>
                <circle cx="60" cy="50" r="4" fill="white"/>
                <path d="M 40 65 Q 50 75 60 65" stroke="white" stroke-width="2" fill="none"/>
              </svg>`;
              break;
            case 'diamond':
              svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,20 80,50 50,80 20,50" fill="${color}"/>
                <circle cx="45" cy="40" r="3" fill="white"/>
                <circle cx="55" cy="40" r="3" fill="white"/>
                <path d="M 45 55 Q 50 60 55 55" stroke="white" stroke-width="2" fill="none"/>
              </svg>`;
              break;
            default:
              svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" fill="${color}"/>
                <text x="50" y="55" text-anchor="middle" fill="white" font-size="20">A${i + 1}</text>
              </svg>`;
              break;
          }
          
          // Convert SVG to data URL
          const dataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
          avatarSvgs.push(dataUrl);
          
          console.log(`✅ Generated avatar ${i + 1}: ${shape} with color ${color}`);
        }
        
        setAvatars(avatarSvgs);
        setIsLoading(false);
        console.log("🎉 All avatars generated successfully!");
        
      } catch (error) {
        console.error("❌ Error generating avatars:", error);
        
        // Fallback to simple colored circles
        const fallbackAvatars = [
          "data:image/svg+xml;base64," + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#4e0eff"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="20">A1</text></svg>'),
          "data:image/svg+xml;base64," + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#997af0"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="20">A2</text></svg>'),
          "data:image/svg+xml;base64," + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#9a86f3"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="20">A3</text></svg>'),
          "data:image/svg+xml;base64," + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#4f04ff"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="20">A4</text></svg>')
        ];
        
        setAvatars(fallbackAvatars);
    setIsLoading(false);
        console.log("🔄 Using fallback avatars");
      }
    };

    generateAvatars();
  }, []);

  return (
    <>
      {isLoading ? (
        <Container>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Generating avatars...</p>
          </div>
        </Container>
      ) : (
        <Container>
          <div className="title-container">
            <h1>Pick an Avatar as your profile picture</h1>
          </div>
          <div className="avatars">
            {avatars.map((avatar, index) => {
              console.log(`Rendering avatar ${index}:`, avatar.substring(0, 100) + '...');
              return (
                <div
                  key={`avatar-${index}`}
                  className={`avatar ${
                    selectedAvatar === index ? "selected" : ""
                  }`}
                  onClick={() => setSelectedAvatar(index)}
                >
                  <img
                    src={avatar}
                    alt={`avatar-${index}`}
                    onLoad={() => console.log(`✅ Avatar ${index} loaded successfully`)}
                    onError={(e) => {
                      console.error(`❌ Avatar ${index} failed to load:`, e.target.src);
                      // Fallback to simple colored circle
                      e.target.src = `data:image/svg+xml;base64,${btoa(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#4e0eff"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="20">A${index + 1}</text></svg>`)}`;
                    }}
                  />
                </div>
              );
            })}
          </div>
          <button onClick={setProfilePicture} className="submit-btn">
            Set as Profile Picture
          </button>
          <ToastContainer />
        </Container>
      )}
    </>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 3rem;
  background-color: #131324;
  height: 100vh;
  width: 100vw;

  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #4e0eff;
      border-top: 4px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    p {
      color: white;
      font-size: 1.2rem;
    }
  }

  .title-container {
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 1rem;
    }
  }
  
  .avatars {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    justify-content: center;

    .avatar {
      border: 0.4rem solid transparent;
      padding: 0.4rem;
      border-radius: 5rem;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: 0.5s ease-in-out;
      cursor: pointer;
      
      img {
        height: 6rem;
        width: 6rem;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #4e0eff;
      }
      
      &:hover {
        transform: scale(1.05);
      }
    }
    
    .selected {
      border: 0.4rem solid #4e0eff;
      transform: scale(1.1);
    }
  }
  
  .submit-btn {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #997af0;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(78, 14, 255, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
