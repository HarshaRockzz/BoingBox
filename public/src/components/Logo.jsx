import React from "react";
import styled from "styled-components";

const Logo = ({ size = "medium", showText = true, className }) => {
  return (
    <LogoContainer size={size} className={className}>
      <LogoIcon size={size}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Simple chat bubble icon */}
          <path 
            d="M20 20h40c11 0 20 9 20 20v20c0 11-9 20-20 20H20c-11 0-20-9-20-20V40c0-11 9-20 20-20z" 
            fill="#4e0eff"
          />
          <path 
            d="M20 20h40c11 0 20 9 20 20v20c0 11-9 20-20 20H20c-11 0-20-9-20-20V40c0-11 9-20 20-20z" 
            fill="url(#gradient)"
            fillOpacity="0.8"
          />
          {/* Message lines */}
          <rect x="30" y="35" width="20" height="3" rx="1.5" fill="white"/>
          <rect x="30" y="42" width="15" height="3" rx="1.5" fill="white"/>
          <rect x="30" y="49" width="25" height="3" rx="1.5" fill="white"/>
          
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4e0eff"/>
              <stop offset="100%" stopColor="#997af0"/>
            </linearGradient>
          </defs>
        </svg>
      </LogoIcon>
      {showText && (
        <LogoText size={size}>
          Boing-Box
        </LogoText>
      )}
    </LogoContainer>
  );
};

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => {
    switch (props.size) {
      case "small": return "0.5rem";
      case "large": return "1.5rem";
      default: return "1rem";
    }
  }};
  
  /* Debug styles - remove in production */
  border: 1px solid transparent;
  min-height: ${props => {
    switch (props.size) {
      case "small": return "2rem";
      case "large": return "5rem";
      default: return "3rem";
    }
  }};
`;

const LogoIcon = styled.div`
  width: ${props => {
    switch (props.size) {
      case "small": return "1.5rem";
      case "large": return "4rem";
      default: return "2.5rem";
    }
  }};
  height: ${props => {
    switch (props.size) {
      case "small": return "1.5rem";
      case "large": return "4rem";
      default: return "2.5rem";
    }
  }};
  
  /* Ensure SVG displays properly */
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 2px 4px rgba(78, 14, 255, 0.3));
    display: block; /* Ensure SVG is displayed as block */
  }
`;

const LogoText = styled.h1`
  color: white;
  text-transform: uppercase;
  font-weight: bold;
  margin: 0;
  font-size: ${props => {
    switch (props.size) {
      case "small": return "1rem";
      case "large": return "2.5rem";
      default: return "1.5rem";
    }
  }};
  
  /* Ensure text is visible */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  
  @media screen and (max-width: 768px) {
    font-size: ${props => {
      switch (props.size) {
        case "small": return "0.8rem";
        case "large": return "2rem";
        default: return "1.2rem";
      }
    }};
  }
`;

export default Logo;
