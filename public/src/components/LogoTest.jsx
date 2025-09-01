import React from "react";
import styled from "styled-components";
import Logo from "./Logo";

const LogoTest = () => {
  return (
    <TestContainer>
      <h2>Logo Test Component</h2>
      <div className="logo-tests">
        <div className="test-item">
          <h3>Small Logo (Text Only)</h3>
          <Logo size="small" showText={false} />
        </div>
        
        <div className="test-item">
          <h3>Small Logo (With Text)</h3>
          <Logo size="small" showText={true} />
        </div>
        
        <div className="test-item">
          <h3>Medium Logo (Default)</h3>
          <Logo />
        </div>
        
        <div className="test-item">
          <h3>Large Logo</h3>
          <Logo size="large" />
        </div>
      </div>
      
      <div className="debug-info">
        <h3>Debug Information:</h3>
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>Local Storage Key: {process.env.REACT_APP_LOCALHOST_KEY}</p>
        <p>API Host: {process.env.REACT_APP_API_HOST}</p>
      </div>
    </TestContainer>
  );
};

const TestContainer = styled.div`
  padding: 2rem;
  background-color: #131324;
  color: white;
  min-height: 100vh;
  
  h2 {
    text-align: center;
    color: #4e0eff;
    margin-bottom: 2rem;
  }
  
  .logo-tests {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 3rem;
    
    .test-item {
      background-color: #00000076;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #4e0eff;
      
      h3 {
        color: #997af0;
        margin-bottom: 1rem;
        font-size: 1rem;
      }
    }
  }
  
  .debug-info {
    background-color: #00000076;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #ff6b6b;
    
    h3 {
      color: #ff6b6b;
      margin-bottom: 1rem;
    }
    
    p {
      margin: 0.5rem 0;
      color: #d1d1d1;
    }
  }
`;

export default LogoTest;
