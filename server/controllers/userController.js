const User = require("../models/userModel");
const bcrypt = require("bcrypt");

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        msg: "Username and password are required", 
        status: false 
      });
    }

    console.log(`🔐 Login attempt for username: ${username}`);
    
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`❌ Login failed: User not found - ${username}`);
      return res.json({ msg: "Incorrect Username or Password", status: false });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`❌ Login failed: Invalid password for user - ${username}`);
      return res.json({ msg: "Incorrect Username or Password", status: false });
    }
    
    delete user.password;
    console.log(`✅ Login successful for user: ${username}`);
    return res.json({ status: true, user });
  } catch (ex) {
    console.error("🚨 Login error:", ex);
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        msg: "Username, email, and password are required", 
        status: false 
      });
    }

    console.log(`📝 Registration attempt for username: ${username}, email: ${email}`);
    
    // Check if username already exists
    const usernameCheck = await User.findOne({ username });
    if (usernameCheck) {
      console.log(`❌ Registration failed: Username already exists - ${username}`);
      return res.json({ msg: "Username already used", status: false });
    }
    
    // Check if email already exists
    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      console.log(`❌ Registration failed: Email already exists - ${email}`);
      return res.json({ msg: "Email already used", status: false });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });
    
    delete user.password;
    console.log(`✅ Registration successful for user: ${username}`);
    return res.json({ status: true, user });
  } catch (ex) {
    console.error("🚨 Registration error:", ex);
    
    // Handle specific MongoDB errors
    if (ex.code === 11000) {
      const field = Object.keys(ex.keyValue)[0];
      return res.json({ 
        msg: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`, 
        status: false 
      });
    }
    
    if (ex.name === 'ValidationError') {
      const errors = Object.values(ex.errors).map(err => err.message);
      return res.json({ 
        msg: errors.join(', '), 
        status: false 
      });
    }
    
    next(ex);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    console.log(`👥 Fetching users for user ID: ${id}`);
    
    const users = await User.find({ _id: { $ne: id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    
    console.log(`✅ Found ${users.length} users`);
    return res.json(users);
  } catch (ex) {
    console.error("🚨 Get all users error:", ex);
    next(ex);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { image } = req.body;
    
    if (!userId || !image) {
      return res.status(400).json({ 
        msg: "User ID and avatar image are required", 
        status: false 
      });
    }

    console.log(`🖼️ Setting avatar for user ID: ${userId}`);
    
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage: image,
      },
      { new: true }
    );
    
    if (!userData) {
      console.log(`❌ Avatar update failed: User not found - ${userId}`);
      return res.status(404).json({ 
        msg: "User not found", 
        status: false 
      });
    }
    
    console.log(`✅ Avatar updated successfully for user: ${userData.username}`);
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    console.error("🚨 Set avatar error:", ex);
    next(ex);
  }
};

module.exports.logOut = (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    console.log(`🚪 Logout for user ID: ${id}`);
    
    if (global.onlineUsers) {
      global.onlineUsers.delete(id);
      console.log(`✅ User ${id} removed from online users`);
    }
    
    return res.status(200).json({ 
      msg: "Logout successful", 
      status: true 
    });
  } catch (ex) {
    console.error("🚨 Logout error:", ex);
    next(ex);
  }
};
