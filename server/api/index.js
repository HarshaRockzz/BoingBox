const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
let connectionAttempts = 0;
const maxRetries = 3;

const connectDB = async () => {
  try {
    if (isConnected) {
      console.log('✅ MongoDB already connected');
      return;
    }

    connectionAttempts++;
    console.log(`🔌 Attempting to connect to MongoDB... (Attempt ${connectionAttempts}/${maxRetries})`);
    
    // Enhanced connection options for better reliability
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferMaxEntries: 0,
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

    isConnected = true;
    console.log('✅ MongoDB Connection Successful');
    console.log(`📊 Database: ${process.env.MONGODB_URI.split('@')[1]?.split('?')[0] || 'Connected'}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB Disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB Reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('🔧 Troubleshooting tips:');
    console.log('❌ MongoDB Connection Error: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you\'re trying to access the database from an IP that isn\'t whitelisted. Make sure your current IP address is on your Atlas cluster\'s IP whitelist: https://docs.atlas.mongodb.com/security-whitelist/');
    console.log('   - Check if MongoDB is running');
    console.log('   - Verify connection string in .env file');
    console.log('   - Ensure network connectivity');
    console.log('   - Check MongoDB Atlas IP whitelist if using cloud');
    console.log(`   - Current connection string: ${process.env.MONGODB_URI}`);
    console.log('⚠️ Server will start without database connection');
    console.log('⚠️ Some features may not work properly');
    
    // Retry connection if attempts < maxRetries
    if (connectionAttempts < maxRetries) {
      console.log(`🔄 Retrying connection in 5 seconds... (${connectionAttempts}/${maxRetries})`);
      setTimeout(connectDB, 5000);
    }
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
    message: '🚀 BoingBox API Server',
    version: '3.0.0',
    status: 'Running',
    database: isConnected ? '✅ Connected' : '❌ Disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    deployment: 'Vercel/Render Serverless',
    features: [
      'Real-time Messaging',
      'Group Management', 
      'Stories & Status',
      'Voice/Video Calls',
      'PWA Support',
      'Media Pipeline'
    ],
    availableRoutes: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/setavatar',
      '/api/auth/allusers',
      '/api/messages/addmsg',
      '/api/messages/getmsg',
      '/api/messages/editmsg',
      '/api/messages/deletemsg',
      '/api/messages/reaction',
      '/api/messages/markread',
      '/api/groups/create',
      '/api/groups/user/:userId',
      '/api/groups/addmember',
      '/api/groups/removemember',
      '/api/groups/updaterole',
      '/api/groups/invitelink',
      '/api/stories/create',
      '/api/stories/user/:userId',
      '/api/stories/all/:userId',
      '/api/stories/view',
      '/api/stories/reply',
      '/api/stories/delete'
    ],
    healthCheck: '/health',
    documentation: 'https://github.com/HarshaRockzz/BoingBox'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.message);
  console.error('�� Stack:', err.stack);
  
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

// Export the app for Vercel
module.exports = app;
