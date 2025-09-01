const Group = require("../models/groupModel");
const User = require("../models/userModel");
const crypto = require("crypto");

module.exports.createGroup = async (req, res, next) => {
  try {
    const { name, description, creator, members, avatar } = req.body;
    
    console.log(`🏗️ Creating group: ${name} by ${creator}`);
    
    if (!name || !creator) {
      return res.status(400).json({ 
        msg: "Group name and creator are required", 
        status: false 
      });
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(8).toString('hex');
    
    const groupData = {
      name,
      description: description || "",
      creator,
      avatar: avatar || "",
      inviteLink: {
        code: inviteCode,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        maxUses: 100
      }
    };

    // Add creator as first member
    const membersList = [{ user: creator, role: 'admin', addedBy: creator }];
    
    // Add other members if provided
    if (members && Array.isArray(members)) {
      for (const memberId of members) {
        if (memberId !== creator) {
          membersList.push({ user: memberId, role: 'member', addedBy: creator });
        }
      }
    }

    groupData.members = membersList;
    groupData.admins = [creator];

    const group = await Group.create(groupData);
    
    // Populate group with member details
    await group.populate('members.user', 'username avatarImage');
    await group.populate('creator', 'username avatarImage');
    
    console.log("✅ Group created successfully");
    
    res.json({ 
      status: true, 
      msg: "Group created successfully.",
      data: group
    });
  } catch (ex) {
    console.error("🚨 Create group error:", ex);
    next(ex);
  }
};

module.exports.getGroups = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    console.log(`👥 Fetching groups for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    const groups = await Group.find({
      "members.user": userId,
      isActive: true
    })
    .populate('members.user', 'username avatarImage')
    .populate('creator', 'username avatarImage')
    .populate('admins', 'username avatarImage')
    .populate('moderators', 'username avatarImage');

    console.log(`✅ Found ${groups.length} groups`);
    
    res.json(groups);
  } catch (ex) {
    console.error("🚨 Get groups error:", ex);
    next(ex);
  }
};

module.exports.addMember = async (req, res, next) => {
  try {
    const { groupId, userId, addedBy, role = 'member' } = req.body;
    
    console.log(`➕ Adding member ${userId} to group ${groupId}`);
    
    if (!groupId || !userId || !addedBy) {
      return res.status(400).json({ 
        msg: "Group ID, user ID, and adder ID are required", 
        status: false 
      });
    }

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ 
        msg: "Group not found", 
        status: false 
      });
    }

    // Check if user is already a member
    const existingMember = group.members.find(
      member => member.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({ 
        msg: "User is already a member of this group", 
        status: false 
      });
    }

    // Check permissions
    const adder = group.members.find(
      member => member.user.toString() === addedBy
    );

    if (!adder || (adder.role !== 'admin' && adder.role !== 'moderator')) {
      return res.status(403).json({ 
        msg: "You don't have permission to add members", 
        status: false 
      });
    }

    // Add new member
    group.members.push({
      user: userId,
      role,
      addedBy,
      joinedAt: new Date()
    });

    // Update role arrays if needed
    if (role === 'admin') {
      group.admins.push(userId);
    } else if (role === 'moderator') {
      group.moderators.push(userId);
    }

    await group.save();
    
    console.log("✅ Member added successfully");
    res.json({ 
      status: true, 
      msg: "Member added successfully." 
    });
  } catch (ex) {
    console.error("🚨 Add member error:", ex);
    next(ex);
  }
};

module.exports.removeMember = async (req, res, next) => {
  try {
    const { groupId, userId, removedBy } = req.body;
    
    console.log(`➖ Removing member ${userId} from group ${groupId}`);
    
    if (!groupId || !userId || !removedBy) {
      return res.status(400).json({ 
        msg: "Group ID, user ID, and remover ID are required", 
        status: false 
      });
    }

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ 
        msg: "Group not found", 
        status: false 
      });
    }

    // Check if user is a member
    const member = group.members.find(
      member => member.user.toString() === userId
    );

    if (!member) {
      return res.status(400).json({ 
        msg: "User is not a member of this group", 
        status: false 
      });
    }

    // Check permissions
    const remover = group.members.find(
      member => member.user.toString() === removedBy
    );

    if (!remover) {
      return res.status(403).json({ 
        msg: "You are not a member of this group", 
        status: false 
      });
    }

    // Only admins can remove members (unless removing themselves)
    if (remover.role !== 'admin' && removedBy !== userId) {
      return res.status(403).json({ 
        msg: "Only admins can remove other members", 
        status: false 
      });
    }

    // Remove from members array
    group.members = group.members.filter(
      member => member.user.toString() !== userId
    );

    // Remove from role arrays
    group.admins = group.admins.filter(id => id.toString() !== userId);
    group.moderators = group.moderators.filter(id => id.toString() !== userId);

    await group.save();
    
    console.log("✅ Member removed successfully");
    res.json({ 
      status: true, 
      msg: "Member removed successfully." 
    });
  } catch (ex) {
    console.error("🚨 Remove member error:", ex);
    next(ex);
  }
};

module.exports.updateGroupRole = async (req, res, next) => {
  try {
    const { groupId, userId, newRole, updatedBy } = req.body;
    
    console.log(`👑 Updating role of ${userId} to ${newRole} in group ${groupId}`);
    
    if (!groupId || !userId || !newRole || !updatedBy) {
      return res.status(400).json({ 
        msg: "Group ID, user ID, new role, and updater ID are required", 
        status: false 
      });
    }

    if (!['member', 'moderator', 'admin'].includes(newRole)) {
      return res.status(400).json({ 
        msg: "Invalid role. Must be member, moderator, or admin", 
        status: false 
      });
    }

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ 
        msg: "Group not found", 
        status: false 
      });
    }

    // Check if user is a member
    const member = group.members.find(
      member => member.user.toString() === userId
    );

    if (!member) {
      return res.status(400).json({ 
        msg: "User is not a member of this group", 
        status: false 
      });
    }

    // Check permissions - only admins can change roles
    const updater = group.members.find(
      member => member.user.toString() === updatedBy
    );

    if (!updater || updater.role !== 'admin') {
      return res.status(403).json({ 
        msg: "Only admins can change member roles", 
        status: false 
      });
    }

    // Update role
    member.role = newRole;

    // Update role arrays
    group.admins = group.admins.filter(id => id.toString() !== userId);
    group.moderators = group.moderators.filter(id => id.toString() !== userId);

    if (newRole === 'admin') {
      group.admins.push(userId);
    } else if (newRole === 'moderator') {
      group.moderators.push(userId);
    }

    await group.save();
    
    console.log("✅ Group role updated successfully");
    res.json({ 
      status: true, 
      msg: "Group role updated successfully." 
    });
  } catch (ex) {
    console.error("🚨 Update group role error:", ex);
    next(ex);
  }
};

module.exports.generateInviteLink = async (req, res, next) => {
  try {
    const { groupId, generatedBy, maxUses = 50 } = req.body;
    
    console.log(`🔗 Generating invite link for group ${groupId}`);
    
    if (!groupId || !generatedBy) {
      return res.status(400).json({ 
        msg: "Group ID and generator ID are required", 
        status: false 
      });
    }

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ 
        msg: "Group not found", 
        status: false 
      });
    }

    // Check permissions - only admins can generate invite links
    const generator = group.members.find(
      member => member.user.toString() === generatedBy
    );

    if (!generator || generator.role !== 'admin') {
      return res.status(403).json({ 
        msg: "Only admins can generate invite links", 
        status: false 
      });
    }

    // Generate new invite code
    const inviteCode = crypto.randomBytes(8).toString('hex');
    
    group.inviteLink = {
      code: inviteCode,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxUses: maxUses,
      currentUses: 0
    };

    await group.save();
    
    console.log("✅ Invite link generated successfully");
    res.json({ 
      status: true, 
      msg: "Invite link generated successfully.",
      data: {
        code: inviteCode,
        expiresAt: group.inviteLink.expiresAt,
        maxUses: group.inviteLink.maxUses
      }
    });
  } catch (ex) {
    console.error("🚨 Generate invite link error:", ex);
    next(ex);
  }
};
