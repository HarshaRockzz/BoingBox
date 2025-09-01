const mongoose = require("mongoose");
require("dotenv").config();

async function testDatabaseConnection() {
  console.log("🔍 Testing MongoDB connection...");
  console.log("📊 Connection string:", process.env.MONGODB_URI || "mongodb://localhost:27017/boingbox");
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/boingbox", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ MongoDB connection successful!");
    console.log("📊 Database name:", mongoose.connection.name);
    console.log("🔌 Connection state:", mongoose.connection.readyState);
    
    // Test creating a collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📚 Collections:", collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log("🔌 Connection closed successfully");
    
  } catch (error) {
    console.error("❌ MongoDB connection failed!");
    console.error("🚨 Error:", error.message);
    console.error("💡 Troubleshooting tips:");
    console.error("   1. Make sure MongoDB is installed and running");
    console.error("   2. Check if MongoDB service is started");
    console.error("   3. Verify the connection string in .env file");
    console.error("   4. Try: mongod --dbpath /path/to/data/db");
    
    if (error.message.includes("ECONNREFUSED")) {
      console.error("🔌 Connection refused - MongoDB is not running");
      console.error("💡 Start MongoDB with: mongod");
    }
    
    if (error.message.includes("ENOTFOUND")) {
      console.error("🌐 Host not found - Check your MONGODB_URI");
    }
  }
}

testDatabaseConnection();
