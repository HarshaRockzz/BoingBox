const mongoose = require("mongoose");

const GroupSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    },
    avatar: {
      type: String,
      default: ""
    },
      creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
      admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  }],
    members: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      role: { 
        type: String, 
        enum: ['member', 'moderator', 'admin'], 
        default: 'member' 
      },
      joinedAt: { type: Date, default: Date.now },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" }
    }],
    inviteLink: {
      code: String,
      expiresAt: Date,
      maxUses: Number,
      currentUses: { type: Number, default: 0 }
    },
    settings: {
      onlyAdminsCanSendMessages: { type: Boolean, default: false },
      onlyAdminsCanEditInfo: { type: Boolean, default: true },
      onlyAdminsCanAddMembers: { type: Boolean, default: false },
      onlyAdminsCanRemoveMembers: { type: Boolean, default: true },
      onlyAdminsCanPinMessages: { type: Boolean, default: true }
    },
      pinnedMessages: [{
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Messages" },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    pinnedAt: { type: Date, default: Date.now }
  }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
GroupSchema.index({ "members.user": 1 });
GroupSchema.index({ creator: 1 });
GroupSchema.index({ "inviteLink.code": 1 });

// Virtual for member count
GroupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Ensure creator is always an admin
GroupSchema.pre('save', function(next) {
  if (this.isNew && !this.admins.includes(this.creator)) {
    this.admins.push(this.creator);
  }
  next();
});

module.exports = mongoose.model("Group", GroupSchema);
