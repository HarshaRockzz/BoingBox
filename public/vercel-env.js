// Environment configuration for Vercel deployment
// This file will be used to set environment variables for production

const config = {
  // Backend API URL - Update this with your deployed backend URL
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || "https://boingbox-backend.onrender.com",
  
  // Environment
  REACT_APP_NODE_ENV: process.env.REACT_APP_NODE_ENV || "production",
  
  // Local storage key
  REACT_APP_LOCALHOST_KEY: process.env.REACT_APP_LOCALHOST_KEY || "boingbox-user",
  
  // Optional: VAPID public key for push notifications
  REACT_APP_VAPID_PUBLIC_KEY: process.env.REACT_APP_VAPID_PUBLIC_KEY || "",
  
  // Optional: Analytics and monitoring
  REACT_APP_GA_TRACKING_ID: process.env.REACT_APP_GA_TRACKING_ID || "",
  REACT_APP_SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN || ""
};

module.exports = config;
