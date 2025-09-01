const Call = require("../models/callModel");
const User = require("../models/userModel");
const Group = require("../models/groupModel");
const crypto = require("crypto");

module.exports.initiateCall = async (req, res, next) => {
  try {
    const { initiator, participants, type = 'voice', groupId, settings } = req.body;
    
    console.log(`📞 Initiating ${type} call: initiator=${initiator}, participants=${participants?.length || 0}`);
    
    if (!initiator || !participants || participants.length === 0) {
      return res.status(400).json({ 
        msg: "Initiator and participants are required", 
        status: false 
      });
    }

    // Generate unique call ID
    const callId = crypto.randomBytes(16).toString('hex');
    
    // Validate participants exist
    const participantIds = groupId ? participants : [initiator, ...participants];
    const validUsers = await User.find({ _id: { $in: participantIds } });
    
    if (validUsers.length !== participantIds.length) {
      return res.status(400).json({ 
        msg: "One or more participants not found", 
        status: false 
      });
    }

    const callData = {
      callId,
      type,
      initiator,
      groupId: groupId || null,
      participants: participantIds.map(userId => ({
        user: userId,
        joinedAt: new Date()
      })),
      settings: settings || {}
    };

    const call = await Call.create(callData);
    
    // Populate participant details
    await call.populate('participants.user', 'username avatarImage');
    await call.populate('initiator', 'username avatarImage');
    
    console.log("✅ Call initiated successfully");
    
    res.json({ 
      status: true, 
      msg: "Call initiated successfully.",
      data: call
    });
  } catch (ex) {
    console.error("🚨 Initiate call error:", ex);
    next(ex);
  }
};

module.exports.joinCall = async (req, res, next) => {
  try {
    const { callId, userId } = req.body;
    
    console.log(`📞 User ${userId} joining call ${callId}`);
    
    if (!callId || !userId) {
      return res.status(400).json({ 
        msg: "Call ID and user ID are required", 
        status: false 
      });
    }

    const call = await Call.findOne({ callId });
    
    if (!call) {
      return res.status(404).json({ 
        msg: "Call not found", 
        status: false 
      });
    }

    if (call.status === 'ended') {
      return res.status(400).json({ 
        msg: "Call has already ended", 
        status: false 
      });
    }

    // Check if user is already a participant
    const existingParticipant = call.participants.find(
      p => p.user.toString() === userId
    );

    if (!existingParticipant) {
      return res.status(403).json({ 
        msg: "You are not a participant in this call", 
        status: false 
      });
    }

    // Update participant status
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date();
    existingParticipant.leftAt = null;

    // Start call if this is the first participant joining
    if (call.status === 'ringing' && call.activeParticipantsCount === 0) {
      call.status = 'ongoing';
      call.startTime = new Date();
    }

    await call.save();
    
    console.log("✅ User joined call successfully");
    res.json({ 
      status: true, 
      msg: "Joined call successfully.",
      data: call
    });
  } catch (ex) {
    console.error("🚨 Join call error:", ex);
    next(ex);
  }
};

module.exports.leaveCall = async (req, res, next) => {
  try {
    const { callId, userId } = req.body;
    
    console.log(`📞 User ${userId} leaving call ${callId}`);
    
    if (!callId || !userId) {
      return res.status(400).json({ 
        msg: "Call ID and user ID are required", 
        status: false 
      });
    }

    const call = await Call.findOne({ callId });
    
    if (!call) {
      return res.status(404).json({ 
        msg: "Call not found", 
        status: false 
      });
    }

    // Find and update participant
    const participant = call.participants.find(
      p => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(400).json({ 
        msg: "You are not a participant in this call", 
        status: false 
      });
    }

    participant.isActive = false;
    participant.leftAt = new Date();

    // End call if no active participants remain
    const activeParticipants = call.participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      call.status = 'ended';
      call.endTime = new Date();
      call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    }

    await call.save();
    
    console.log("✅ User left call successfully");
    res.json({ 
      status: true, 
      msg: "Left call successfully.",
      data: call
    });
  } catch (ex) {
    console.error("🚨 Leave call error:", ex);
    next(ex);
  }
};

module.exports.updateCallSettings = async (req, res, next) => {
  try {
    const { callId, userId, settings } = req.body;
    
    console.log(`📞 Updating call settings for ${callId}`);
    
    if (!callId || !userId || !settings) {
      return res.status(400).json({ 
        msg: "Call ID, user ID, and settings are required", 
        status: false 
      });
    }

    const call = await Call.findOne({ callId });
    
    if (!call) {
      return res.status(404).json({ 
        msg: "Call not found", 
        status: false 
      });
    }

    // Only initiator can update call settings
    if (call.initiator.toString() !== userId) {
      return res.status(403).json({ 
        msg: "Only the call initiator can update settings", 
        status: false 
      });
    }

    call.settings = { ...call.settings, ...settings };
    await call.save();
    
    console.log("✅ Call settings updated successfully");
    res.json({ 
      status: true, 
      msg: "Call settings updated successfully.",
      data: call
    });
  } catch (ex) {
    console.error("🚨 Update call settings error:", ex);
    next(ex);
  }
};

module.exports.updateParticipantStatus = async (req, res, next) => {
  try {
    const { callId, userId, updates } = req.body;
    
    console.log(`📞 Updating participant status for ${userId} in call ${callId}`);
    
    if (!callId || !userId || !updates) {
      return res.status(400).json({ 
        msg: "Call ID, user ID, and updates are required", 
        status: false 
      });
    }

    const call = await Call.findOne({ callId });
    
    if (!call) {
      return res.status(404).json({ 
        msg: "Call not found", 
        status: false 
      });
    }

    const participant = call.participants.find(
      p => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(400).json({ 
        msg: "You are not a participant in this call", 
        status: false 
      });
    }

    // Update participant status
    Object.assign(participant, updates);
    await call.save();
    
    console.log("✅ Participant status updated successfully");
    res.json({ 
      status: true, 
      msg: "Participant status updated successfully.",
      data: call
    });
  } catch (ex) {
    console.error("🚨 Update participant status error:", ex);
    next(ex);
  }
};

module.exports.getCallHistory = async (req, res, next) => {
  try {
    const { userId, page = 1, limit = 20 } = req.params;
    
    console.log(`📞 Fetching call history for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    const skip = (page - 1) * limit;
    
    const calls = await Call.find({
      "participants.user": userId,
      status: { $in: ['ended', 'missed', 'declined'] }
    })
    .populate('participants.user', 'username avatarImage')
    .populate('initiator', 'username avatarImage')
    .populate('groupId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    console.log(`✅ Found ${calls.length} call history entries`);
    
    res.json(calls);
  } catch (ex) {
    console.error("🚨 Get call history error:", ex);
    next(ex);
  }
};

module.exports.endCall = async (req, res, next) => {
  try {
    const { callId, userId } = req.body;
    
    console.log(`📞 Ending call ${callId} by user ${userId}`);
    
    if (!callId || !userId) {
      return res.status(400).json({ 
        msg: "Call ID and user ID are required", 
        status: false 
      });
    }

    const call = await Call.findOne({ callId });
    
    if (!call) {
      return res.status(404).json({ 
        msg: "Call not found", 
        status: false 
      });
    }

    // Only initiator or admins can end the call
    const canEndCall = call.initiator.toString() === userId || 
                      (call.groupId && await Group.findOne({
                        _id: call.groupId,
                        "members.user": userId,
                        "members.role": { $in: ['admin', 'moderator'] }
                      }));

    if (!canEndCall) {
      return res.status(403).json({ 
        msg: "You don't have permission to end this call", 
        status: false 
      });
    }

    call.status = 'ended';
    call.endTime = new Date();
    call.duration = Math.floor((call.endTime - call.startTime) / 1000);

    // Mark all participants as inactive
    call.participants.forEach(participant => {
      participant.isActive = false;
      if (!participant.leftAt) {
        participant.leftAt = new Date();
      }
    });

    await call.save();
    
    console.log("✅ Call ended successfully");
    res.json({ 
      status: true, 
      msg: "Call ended successfully.",
      data: call
    });
  } catch (ex) {
    console.error("🚨 End call error:", ex);
    next(ex);
  }
};
