import React, { useState } from "react";
import styled from "styled-components";

const Avatar = ({ 
  src, 
  alt = "avatar", 
  size = "medium", 
  fallbackText = "?", 
  className,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  if (imageError || !src) {
    return (
      <AvatarFallback 
        size={size} 
        className={className}
        onClick={handleClick}
        clickable={!!onClick}
      >
        {fallbackText}
      </AvatarFallback>
    );
  }

  return (
    <AvatarImage 
      src={src} 
      alt={alt} 
      size={size} 
      className={className}
      onError={handleImageError}
      onClick={handleClick}
      clickable={!!onClick}
    />
  );
};

const AvatarImage = styled.img`
  width: ${props => {
    switch (props.size) {
      case "small": return "2rem";
      case "large": return "6rem";
      default: return "3rem";
    }
  }};
  height: ${props => {
    switch (props.size) {
      case "small": return "2rem";
      case "large": return "6rem";
      default: return "3rem";
    }
  }};
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4e0eff;
  background-color: #080420;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: ${props => props.clickable ? 'scale(1.05)' : 'none'};
  }
`;

const AvatarFallback = styled.div`
  width: ${props => {
    switch (props.size) {
      case "small": return "2rem";
      case "large": return "6rem";
      default: return "3rem";
    }
  }};
  height: ${props => {
    switch (props.size) {
      case "small": return "2rem";
      case "large": return "6rem";
      default: return "3rem";
    }
  }};
  border-radius: 50%;
  background: linear-gradient(135deg, #4e0eff, #997af0);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: ${props => {
    switch (props.size) {
      case "small": return "0.8rem";
      case "large": return "2rem";
      default: return "1.2rem";
    }
  }};
  border: 2px solid #4e0eff;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: ${props => props.clickable ? 'scale(1.05)' : 'none'};
  }
`;

export default Avatar;
