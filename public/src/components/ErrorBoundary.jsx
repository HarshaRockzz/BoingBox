import React from 'react';
import styled from 'styled-components';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <h1>Something went wrong.</h1>
          <p>We're sorry, but something unexpected happened.</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Try Again
          </button>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #131324;
  color: white;
  text-align: center;
  padding: 2rem;

  h1 {
    color: #ff6b6b;
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 2rem;
    color: #d1d1d1;
  }

  button {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    border-radius: 0.4rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #997af0;
    }
  }
`;

export default ErrorBoundary;
