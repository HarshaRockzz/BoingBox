import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = ({ size = "medium", color = "#4e0eff" }) => {
  return (
    <SpinnerContainer size={size}>
      <Spinner color={color} />
    </SpinnerContainer>
  );
};

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => {
    switch (props.size) {
      case "small": return "20px";
      case "large": return "60px";
      default: return "40px";
    }
  }};
  height: ${props => {
    switch (props.size) {
      case "small": return "20px";
      case "large": return "60px";
      default: return "40px";
    }
  }};
`;

const Spinner = styled.div`
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid ${props => props.color};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

export default LoadingSpinner;
