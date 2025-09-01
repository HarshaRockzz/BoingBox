// Input validation utilities
export const validateUsername = (username) => {
  if (!username || username.trim().length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters long" };
  }
  if (username.trim().length > 20) {
    return { isValid: false, message: "Username must be less than 20 characters" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return { isValid: false, message: "Username can only contain letters, numbers, and underscores" };
  }
  return { isValid: true, message: "" };
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, message: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: "Please enter a valid email address" };
  }
  return { isValid: true, message: "" };
};

export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (password.length > 128) {
    return { isValid: false, message: "Password must be less than 128 characters" };
  }
  return { isValid: true, message: "" };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

export const validateMessage = (message) => {
  if (!message || message.trim().length === 0) {
    return { isValid: false, message: "Message cannot be empty" };
  }
  if (message.trim().length > 1000) {
    return { isValid: false, message: "Message is too long (max 1000 characters)" };
  }
  return { isValid: true, message: "" };
};
