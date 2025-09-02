const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Initialize global online users map
global.onlineUsers = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection
let isConnected = false;

const connectDB = async () => {
  try {
    if (isConnected) {
      console.log('✅ MongoDB already connected');
      return;
    }

    console.log('🔌 Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('✅ MongoDB Connection Successful');
    console.log(`📊 Database: ${process.env.MONGODB_URI}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('🔧 Troubleshooting tips:');
    console.log('- Check if MongoDB is running');
    console.log('- Verify connection string in .env file');
    console.log('- Ensure network connectivity');
    console.log('- Check MongoDB Atlas IP whitelist if using cloud');
    console.log(`- Current connection string: ${process.env.MONGODB_URI}`);
    console.log('⚠️ Server will start without database connection');
    console.log('⚠️ Some features may not work properly');
  }
};

// Connect to database
connectDB();

// Import models after database connection
const userModel = require('../models/userModel');
const messageModel = require('../models/messageModel');
const groupModel = require('../models/groupModel');
const storyModel = require('../models/storyModel');
const callModel = require('../models/callModel');
const mediaModel = require('../models/mediaModel');

// Import routes
const authRoutes = require('../routes/auth');
const messageRoutes = require('../routes/messages');
const groupRoutes = require('../routes/groups');
const storyRoutes = require('../routes/stories');
const callRoutes = require('../routes/calls');
const mediaRoutes = require('../routes/media');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/media', mediaRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BoingBox API Server',
    version: '3.0.0',
    status: 'Running',
    database: isConnected ? 'Connected' : 'Disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.message);
  console.error('📝 Stack:', err.stack);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Add user to online users
  socket.on("add-user", (userId) => {
    global.onlineUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} added to online users`);
  });

  // Send message
  socket.on("send-msg", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data.message);
      console.log(`📤 Message sent to user ${data.to}`);
    } else {
      console.log(`⚠️ User ${data.to} is not online`);
    }
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("typing", data);
    }
  });

  // Call signaling events
  socket.on("call-request", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-request", data);
    }
  });

  socket.on("call-accepted", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-accepted", data);
    }
  });

  socket.on("call-rejected", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-rejected", data);
    }
  });

  socket.on("call-end", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-end", data);
    }
  });

  socket.on("call-ice-candidate", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-ice-candidate", data);
    }
  });

  socket.on("call-offer", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-offer", data);
    }
  });

  socket.on("call-answer-sdp", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-answer-sdp", data);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    // Remove user from online users
    for (let [userId, socketId] of global.onlineUsers.entries()) {
      if (socketId === socket.id) {
        global.onlineUsers.delete(userId);
        console.log(`👤 User ${userId} removed from online users`);
        break;
      }
    }
  });
});

// Export the app for Vercel
module.exports = app;
