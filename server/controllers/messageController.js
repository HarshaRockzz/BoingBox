const Messages = require("../models/messageModel");
const Group = require("../models/groupModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to, groupId, page = 1, limit = 50 } = req.body;
    
    console.log(`💬 Fetching messages: from=${from}, to=${to}, groupId=${groupId}, page=${page}`);
    
    if (!from) {
      console.log("❌ Missing 'from' parameter");
      return res.status(400).json({ 
        msg: "Sender ID is required", 
        status: false 
      });
    }

    let query = {};
    let sort = { createdAt: -1 };
    
    if (groupId) {
      // Group chat
      query = { 
        groupId, 
        "deleted.isDeleted": false 
      };
    } else if (to) {
      // Private chat
      query = { 
        users: { $all: [from, to] },
        chatType: 'private',
        "deleted.isDeleted": false
      };
    } else {
      return res.status(400).json({ 
        msg: "Either 'to' (for private) or 'groupId' (for group) is required", 
        status: false 
      });
    }

    const skip = (page - 1) * limit;
    
    const messages = await Messages.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatarImage')
      .lean(); // Use lean() for better performance and avoid populate issues

    console.log(`✅ Found ${messages.length} messages`);

    // Reverse for chronological order (oldest first)
    const projectedMessages = messages.reverse().map((msg) => {
      return {
        _id: msg._id,
        type: msg.message.type,
        text: msg.message.text,
        media: msg.message.media,
        fromSelf: msg.sender._id.toString() === from,
        sender: {
          _id: msg.sender._id,
          username: msg.sender.username,
          avatarImage: msg.sender.avatarImage
        },
        timestamp: msg.createdAt,
        edited: msg.edited,
        chatType: msg.chatType,
        groupId: msg.groupId
      };
    });
    
    res.json(projectedMessages);
  } catch (ex) {
    console.error("🚨 Get messages error:", ex);
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, groupId, message, type = 'text', replyTo, media } = req.body;
    
    console.log(`📝 Adding message: type=${type}, from=${from}, to=${to}, groupId=${groupId}, message=${message}`);
    
    if (!from || (!to && !groupId)) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ 
        msg: "Sender ID and either recipient ID or group ID are required", 
        status: false 
      });
    }

    // Handle both old and new message formats
    let messageText = message;
    if (typeof message === 'object' && message.text) {
      messageText = message.text;
    } else if (typeof message === 'string') {
      messageText = message;
    }

    if (type === 'text' && !messageText) {
      console.log("❌ Text message content is required");
      return res.status(400).json({ 
        msg: "Message content is required for text messages", 
        status: false 
      });
    }

    if (type !== 'text' && !media) {
      console.log("❌ Media content is required for non-text messages");
      return res.status(400).json({ 
        msg: "Media content is required for non-text messages", 
        status: false 
      });
    }

    let messageData = {
      message: {
        type,
        text: type === 'text' ? messageText : undefined,
        media: type !== 'text' ? media : undefined
      },
      sender: from,
      chatType: groupId ? 'group' : 'private',
      users: groupId ? undefined : [from, to],
      groupId: groupId || undefined,
      replyTo: replyTo || undefined
    };

    console.log("📝 Creating message with data:", JSON.stringify(messageData, null, 2));

    const newMessage = await Messages.create(messageData);
    
    // Populate sender info
    await newMessage.populate('sender', 'username avatarImage');
    
    console.log("✅ Message added successfully");
    
    res.json({ 
      status: true, 
      message: "Message added successfully.",
      data: {
        _id: newMessage._id,
        type: newMessage.message.type,
        text: newMessage.message.text,
        media: newMessage.message.media,
        sender: {
          _id: newMessage.sender._id,
          username: newMessage.sender.username,
          avatarImage: newMessage.sender.avatarImage
        },
        timestamp: newMessage.createdAt,
        chatType: newMessage.chatType,
        groupId: newMessage.groupId
      }
    });
  } catch (ex) {
    console.error("🚨 Add message error:", ex);
    next(ex);
  }
};

module.exports.editMessage = async (req, res, next) => {
  try {
    const { messageId, newText, editedBy } = req.body;
    
    console.log(`✏️ Editing message: ${messageId}`);
    
    if (!messageId || !newText || !editedBy) {
      return res.status(400).json({ 
        msg: "Message ID, new text, and editor ID are required", 
        status: false 
      });
    }

    const message = await Messages.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ 
        msg: "Message not found", 
        status: false 
      });
    }

    if (message.sender.toString() !== editedBy) {
      return res.status(403).json({ 
        msg: "You can only edit your own messages", 
        status: false 
      });
    }

    // Store original text if not already stored
    if (!message.edited.isEdited) {
      message.edited.originalText = message.message.text;
    }

    message.message.text = newText;
    message.edited.isEdited = true;
    message.edited.editedAt = new Date();

    await message.save();
    
    console.log("✅ Message edited successfully");
    res.json({ 
      status: true, 
      msg: "Message edited successfully." 
    });
  } catch (ex) {
    console.error("🚨 Edit message error:", ex);
    next(ex);
  }
};

module.exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId, deletedBy } = req.body;
    
    console.log(`🗑️ Deleting message: ${messageId}`);
    
    if (!messageId || !deletedBy) {
      return res.status(400).json({ 
        msg: "Message ID and deleter ID are required", 
        status: false 
      });
    }

    const message = await Messages.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ 
        msg: "Message not found", 
        status: false 
      });
    }

    if (message.sender.toString() !== deletedBy) {
      return res.status(403).json({ 
        msg: "You can only delete your own messages", 
        status: false 
      });
    }

    message.deleted.isDeleted = true;
    message.deleted.deletedAt = new Date();
    message.deleted.deletedBy = deletedBy;

    await message.save();
    
    console.log("✅ Message deleted successfully");
    res.json({ 
      status: true, 
      msg: "Message deleted successfully." 
    });
  } catch (ex) {
    console.error("🚨 Delete message error:", ex);
    next(ex);
  }
};

module.exports.addReaction = async (req, res, next) => {
  try {
    const { messageId, userId, emoji } = req.body;
    
    console.log(`😀 Adding reaction: ${emoji} to message ${messageId}`);
    
    if (!messageId || !userId || !emoji) {
      return res.status(400).json({ 
        msg: "Message ID, user ID, and emoji are required", 
        status: false 
      });
    }

    const message = await Messages.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ 
        msg: "Message not found", 
        status: false 
      });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== userId
    );

    // Add new reaction
    message.reactions.push({
      user: userId,
      emoji,
      createdAt: new Date()
    });

    await message.save();
    
    console.log("✅ Reaction added successfully");
    res.json({ 
      status: true, 
      msg: "Reaction added successfully." 
    });
  } catch (ex) {
    console.error("🚨 Add reaction error:", ex);
    next(ex);
  }
};

module.exports.markAsRead = async (req, res, next) => {
  try {
    const { messageId, userId } = req.body;
    
    console.log(`👁️ Marking message ${messageId} as read by ${userId}`);
    
    if (!messageId || !userId) {
      return res.status(400).json({ 
        msg: "Message ID and user ID are required", 
        status: false 
      });
    }

    const message = await Messages.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ 
        msg: "Message not found", 
        status: false 
      });
    }

    // Check if already read
    const alreadyRead = message.readBy.find(
      read => read.user.toString() === userId
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: userId,
        readAt: new Date()
      });
      await message.save();
    }
    
    console.log("✅ Message marked as read");
    res.json({ 
      status: true, 
      msg: "Message marked as read." 
    });
  } catch (ex) {
    console.error("🚨 Mark as read error:", ex);
    next(ex);
  }
};
