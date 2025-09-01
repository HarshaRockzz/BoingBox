import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerRoute } from "../utils/APIRoutes";
import { validateUsername, validateEmail, validatePassword, sanitizeInput } from "../utils/validation";

export default function Register() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
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

  const handleValidation = () => {
    const newErrors = {};
    
    const usernameValidation = validateUsername(values.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.message;
    }
    
    const emailValidation = validateEmail(values.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
    }
    
    const passwordValidation = validatePassword(values.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }
    
    if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (values.confirmPassword === "") {
      newErrors.confirmPassword = "Please confirm your password";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (handleValidation()) {
      const { email, username, password } = values;
      try {
        const { data } = await axios.post(registerRoute, { username, email, password });
        if (data.status === false) {
          toast.error(data.msg, toastOptions);
        } else {
          localStorage.setItem(process.env.REACT_APP_LOCALHOST_KEY, JSON.stringify(data.user));
          navigate("/");
        }
      } catch (error) {
        toast.error("An error occurred during registration. Please try again later.", toastOptions);
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
              className={errors.username ? "error" : ""}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={values.email}
              onChange={(e) => handleChange(e)}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={values.password}
              onChange={(e) => handleChange(e)}
              className={errors.password ? "error" : ""}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={(e) => handleChange(e)}
              className={errors.confirmPassword ? "error" : ""}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
          <button type="submit">Create User</button>
          <span>
            Already have an account ? <Link to="/login">Login.</Link>
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
    padding: 3rem 5rem;
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
