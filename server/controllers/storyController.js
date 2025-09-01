const Story = require("../models/storyModel");
const User = require("../models/userModel");

module.exports.createStory = async (req, res, next) => {
  try {
    const { user, type, content, style } = req.body;
    
    console.log(`📖 Creating story: type=${type} by user=${user}`);
    
    if (!user || !type) {
      return res.status(400).json({ 
        msg: "User ID and story type are required", 
        status: false 
      });
    }

    if (type === 'text' && !content.text) {
      return res.status(400).json({ 
        msg: "Text content is required for text stories", 
        status: false 
      });
    }

    if (type !== 'text' && !content.media) {
      return res.status(400).json({ 
        msg: "Media content is required for non-text stories", 
        status: false 
      });
    }

    const storyData = {
      user,
      type,
      content,
      style: style || {},
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    const story = await Story.create(storyData);
    
    // Populate user info
    await story.populate('user', 'username avatarImage');
    
    console.log("✅ Story created successfully");
    
    res.json({ 
      status: true, 
      msg: "Story created successfully.",
      data: story
    });
  } catch (ex) {
    console.error("🚨 Create story error:", ex);
    next(ex);
  }
};

module.exports.getStories = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    console.log(`📖 Fetching stories for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    const stories = await Story.find({
      user: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'username avatarImage')
    .populate('views.user', 'username avatarImage')
    .populate('replies.user', 'username avatarImage')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${stories.length} active stories`);
    
    res.json(stories);
  } catch (ex) {
    console.error("🚨 Get stories error:", ex);
    next(ex);
  }
};

module.exports.getAllStories = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    console.log(`📖 Fetching all stories for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    // Get user's contacts (you'll need to implement this based on your user model)
    // For now, we'll get stories from all users
    const stories = await Story.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'username avatarImage')
    .populate('views.user', 'username avatarImage')
    .populate('replies.user', 'username avatarImage')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${stories.length} active stories from all users`);
    
    res.json(stories);
  } catch (ex) {
    console.error("🚨 Get all stories error:", ex);
    next(ex);
  }
};

module.exports.viewStory = async (req, res, next) => {
  try {
    const { storyId, userId } = req.body;
    
    console.log(`👁️ User ${userId} viewing story ${storyId}`);
    
    if (!storyId || !userId) {
      return res.status(400).json({ 
        msg: "Story ID and user ID are required", 
        status: false 
      });
    }

    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ 
        msg: "Story not found", 
        status: false 
      });
    }

    if (story.isExpired) {
      return res.status(400).json({ 
        msg: "Story has expired", 
        status: false 
      });
    }

    // Check if already viewed
    const alreadyViewed = story.views.find(
      view => view.user.toString() === userId
    );

    if (!alreadyViewed) {
      story.views.push({
        user: userId,
        viewedAt: new Date()
      });
      await story.save();
    }
    
    console.log("✅ Story viewed successfully");
    res.json({ 
      status: true, 
      msg: "Story viewed successfully." 
    });
  } catch (ex) {
    console.error("🚨 View story error:", ex);
    next(ex);
  }
};

module.exports.replyToStory = async (req, res, next) => {
  try {
    const { storyId, userId, message } = req.body;
    
    console.log(`💬 User ${userId} replying to story ${storyId}`);
    
    if (!storyId || !userId || !message) {
      return res.status(400).json({ 
        msg: "Story ID, user ID, and message are required", 
        status: false 
      });
    }

    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ 
        msg: "Story not found", 
        status: false 
      });
    }

    if (story.isExpired) {
      return res.status(400).json({ 
        msg: "Story has expired", 
        status: false 
      });
    }

    story.replies.push({
      user: userId,
      message,
      createdAt: new Date()
    });

    await story.save();
    
    console.log("✅ Story reply added successfully");
    res.json({ 
      status: true, 
      msg: "Story reply added successfully." 
    });
  } catch (ex) {
    console.error("🚨 Reply to story error:", ex);
    next(ex);
  }
};

module.exports.deleteStory = async (req, res, next) => {
  try {
    const { storyId, userId } = req.body;
    
    console.log(`🗑️ User ${userId} deleting story ${storyId}`);
    
    if (!storyId || !userId) {
      return res.status(400).json({ 
        msg: "Story ID and user ID are required", 
        status: false 
      });
    }

    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ 
        msg: "Story not found", 
        status: false 
      });
    }

    if (story.user.toString() !== userId) {
      return res.status(403).json({ 
        msg: "You can only delete your own stories", 
        status: false 
      });
    }

    story.isActive = false;
    await story.save();
    
    console.log("✅ Story deleted successfully");
    res.json({ 
      status: true, 
      msg: "Story deleted successfully." 
    });
  } catch (ex) {
    console.error("🚨 Delete story error:", ex);
    next(ex);
  }
};
