import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { loginRoute } from "../utils/APIRoutes";
import { validateUsername, validatePassword, sanitizeInput } from "../utils/validation";

export default function Login() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  useEffect(() => {
    const storedData = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
    if (storedData) {
      try {
        const userData = JSON.parse(storedData);
        if (userData && userData.username) {
          navigate("/");
        }
      } catch (error) {
        // Clear invalid data from localStorage
        localStorage.removeItem(process.env.REACT_APP_LOCALHOST_KEY);
      }
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const sanitizedValue = sanitizeInput(value);
    setValues({ ...values, [name]: sanitizedValue });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const usernameValidation = validateUsername(values.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.message;
    }
    
    const passwordValidation = validatePassword(values.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      const { username, password } = values;
      try {
        const { data } = await axios.post(loginRoute, { username, password });
        if (data.status === false) {
          toast.error(data.msg, toastOptions);
        } else {
          localStorage.setItem(
            process.env.REACT_APP_LOCALHOST_KEY,
            JSON.stringify(data.user)
          );
          navigate("/");
        }
      } catch (error) {
        toast.error("An error occurred during login. Please try again later.", toastOptions);
      }
    }
  };

  return (
    <>
      <FormContainer>
        <form onSubmit={(event) => handleSubmit(event)}>
          <div className="brand">
            <Logo size="large" />
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={values.username}
              onChange={(e) => handleChange(e)}
              minLength="3"
              required
              className={errors.username ? "error" : ""}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={values.password}
              onChange={(e) => handleChange(e)}
              required
              className={errors.password ? "error" : ""}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          <button type="submit">Log In</button>
          <span>
            Don't have an account ? <Link to="/register">Create One.</Link>
          </span>
        </form>
      </FormContainer>
      <ToastContainer />
    </>
  );
}

const FormContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 5rem;
    }
    h1 {
      color: white;
      text-transform: uppercase;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background-color: #00000076;
    border-radius: 2rem;
    padding: 5rem;
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  input {
    background-color: transparent;
    padding: 1rem;
    border: 0.1rem solid #4e0eff;
    border-radius: 0.4rem;
    color: white;
    width: 100%;
    font-size: 1rem;
    
    &:focus {
      border: 0.1rem solid #997af0;
      outline: none;
    }
    
    &.error {
      border-color: #ff6b6b;
    }
  }
  
  .error-message {
    color: #ff6b6b;
    font-size: 0.8rem;
    margin-left: 0.5rem;
  }
  
  button {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    transition: background-color 0.3s ease;
    
    &:hover {
      background-color: #997af0;
    }
  }
  
  span {
    color: white;
    text-transform: uppercase;
    a {
      color: #4e0eff;
      text-decoration: none;
      font-weight: bold;
      
      &:hover {
        color: #997af0;
      }
    }
  }
`;
