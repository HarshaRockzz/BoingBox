const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize global variables
global.onlineUsers = new Map();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// Database connection check middleware
app.use((req, res, next) => {
  if (!isConnected && req.path.startsWith('/api/')) {
    return res.status(503).json({
      status: false,
      msg: "Database is not connected. Please try again later.",
      error: "DATABASE_CONNECTION_ERROR"
    });
  }
  next();
});

// Database connection
let isConnected = false;

const connectDB = async () => {
  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    isConnected = true;
    console.log("✅ MongoDB Connection Successful");
    console.log(`📊 Database: ${process.env.MONGODB_URI}`);
    
    // Import and register Mongoose models after connection
    console.log("📚 Registering Mongoose models...");
    require("./models/userModel");
    require("./models/messageModel");
    require("./models/groupModel");
    require("./models/storyModel");
    require("./models/callModel");
    require("./models/mediaModel");
    console.log("✅ All models registered successfully");
    
    // Verify models are registered
    console.log("🔍 Registered models:", Object.keys(mongoose.models));
    
    return conn;
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("🔧 Troubleshooting tips:");
    console.log("   - Check if MongoDB is running");
    console.log("   - Verify connection string in .env file");
    console.log("   - Ensure network connectivity");
    console.log("   - Check MongoDB Atlas IP whitelist if using cloud");
    console.log("   - Current connection string:", process.env.MONGODB_URI);
    
    // Don't exit, just return false
    return false;
  }
};

// Start server only after database connection
const startServer = async () => {
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    console.log("⚠️ Server will start without database connection");
    console.log("⚠️ Some features may not work properly");
  }
  
  // Start server regardless of database status
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log("🚀 Server started on port", PORT);
    console.log("🌍 Environment:", process.env.NODE_ENV || "development");
    
    // Show appropriate URLs based on environment
    if (process.env.NODE_ENV === 'production') {
      console.log("🔗 Production Server Running");
      console.log("📱 Client URL:", process.env.CLIENT_URL || "Not configured");
    } else {
      console.log("🔗 API URL:", `http://localhost:${PORT}`);
      console.log("📱 Client URL:", process.env.CLIENT_URL || "http://localhost:3000");
    }
    
    if (dbConnected) {
      console.log("✅ Server is fully operational with database");
} else {
      console.log("⚠️ Server is running but database is not connected");
    }
  });
};

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/groups", require("./routes/groups"));
app.use("/api/stories", require("./routes/stories"));
app.use("/api/calls", require("./routes/calls"));
app.use("/api/media", require("./routes/media"));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err);
  console.log("📝 Stack:", err.stack);
  
  res.status(500).json({
    status: false,
    msg: process.env.NODE_ENV === 'development' ? err.message : "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    status: false,
    msg: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/auth/login",
      "/api/auth/register", 
      "/api/auth/setavatar",
      "/api/auth/allusers",
      "/api/messages/addmsg",
      "/api/messages/getmsg",
      "/api/messages/editmsg",
      "/api/messages/deletemsg",
      "/api/messages/reaction",
      "/api/messages/markread",
      "/api/groups/create",
      "/api/groups/user/:userId",
      "/api/groups/addmember",
      "/api/groups/removemember",
      "/api/groups/updaterole",
      "/api/groups/invitelink",
      "/api/stories/create",
      "/api/stories/user/:userId",
      "/api/stories/all/:userId",
      "/api/stories/view",
      "/api/stories/reply",
      "/api/stories/delete"
    ]
  });
});

// Root path
  app.get("/", (req, res) => {
  res.json({
    status: true,
    msg: "Boing-Box Chat API Server",
    version: "2.0.0",
    features: [
      "Enhanced Messaging (Text, Media, Reactions, Replies)",
      "Group Chats with Role Management",
      "Stories/Status with 24h TTL",
      "Real-time Communication (Socket.IO)",
      "Voice/Video Calls (WebRTC)",
      "PWA Support (Offline, Installable)",
      "Media Pipeline (Uploads, Processing)",
      "Advanced User Management"
    ],
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    database: {
      connected: isConnected,
      status: isConnected ? "operational" : "disconnected"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: true,
    timestamp: new Date().toISOString(),
    server: "running",
    database: {
      connected: isConnected,
      status: isConnected ? "operational" : "disconnected"
    },
    uptime: process.uptime()
  });
});

// Server setup
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);
  
  socket.on("add-user", (userId) => {
    global.onlineUsers = global.onlineUsers || new Map();
    global.onlineUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} added to online users`);
  });

  socket.on("send-msg", (data) => {
    try {
      if (!data || !data.to) {
        console.log("⚠️ Invalid message data");
        return;
      }
      
      const sendUserSocket = global.onlineUsers.get(data.to);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("msg-receive", data.msg || data.message);
        console.log(`💬 Message sent from ${data.from} to ${data.to}`);
      } else {
        console.log(`⚠️ User ${data.to} is not online`);
      }
    } catch (error) {
      console.error("❌ Error in send-msg:", error);
    }
  });

  socket.on("typing", (data) => {
    try {
      if (!data || !data.to) {
        return;
      }
      
      const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
        socket.to(sendUserSocket).emit("typing-receive", data);
        console.log(`⌨️ Typing indicator from ${data.from} to ${data.to}`);
      }
    } catch (error) {
      console.error("❌ Error in typing:", error);
    }
  });

  // Call signaling events
  socket.on("call-request", (data) => {
    console.log(`📞 Call request from ${data.from} to ${data.to}`);
    socket.to(data.to).emit("incoming-call", {
      from: { _id: data.from, type: data.type },
      type: data.type,
      participants: data.participants
    });
  });

  socket.on("call-accepted", (data) => {
    console.log(`✅ Call accepted by ${data.from}`);
    socket.to(data.to).emit("call-accepted", { from: data.from, type: data.type });
  });

  socket.on("call-rejected", (data) => {
    console.log(`❌ Call rejected by ${data.from}`);
    socket.to(data.to).emit("call-rejected", { from: data.from });
  });

  socket.on("call-end", (data) => {
    console.log(`🔚 Call ended by ${data.from}`);
    socket.to(data.to).emit("call-ended", { from: data.from });
  });

  socket.on("call-ice-candidate", (data) => {
    console.log(`🧊 ICE candidate from ${data.from} to ${data.to}`);
    socket.to(data.to).emit("call-ice-candidate", data);
  });

  socket.on("call-offer", (data) => {
    console.log(`📤 Call offer from ${data.from} to ${data.to}`);
    socket.to(data.to).emit("call-offer", data);
  });

  socket.on("call-answer-sdp", (data) => {
    console.log(`📥 Call answer from ${data.from} to ${data.to}`);
    socket.to(data.to).emit("call-answer-sdp", data);
  });

  socket.on("disconnect", () => {
    // Remove user from online users when they disconnect
    for (const [userId, socketId] of global.onlineUsers.entries()) {
      if (socketId === socket.id) {
        global.onlineUsers.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Start server
startServer();
