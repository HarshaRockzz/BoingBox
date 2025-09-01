const mongoose = require("mongoose");

const CallSchema = mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['voice', 'video', 'screen-share'],
      required: true
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true
    },
    participants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      joinedAt: { type: Date, default: Date.now },
      leftAt: Date,
      isActive: { type: Boolean, default: true },
      isMuted: { type: Boolean, default: false },
      isVideoOff: { type: Boolean, default: false },
      isScreenSharing: { type: Boolean, default: false }
    }],
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: false
    },
    status: {
      type: String,
      enum: ['ringing', 'ongoing', 'ended', 'missed', 'declined'],
      default: 'ringing'
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // in seconds
    settings: {
      maxParticipants: { type: Number, default: 10 },
      allowScreenShare: { type: Boolean, default: true },
      allowRecording: { type: Boolean, default: false },
      quality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    },
    recording: {
      isRecording: { type: Boolean, default: false },
      recordingUrl: String,
      recordingStartTime: Date,
      recordingEndTime: Date
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
CallSchema.index({ callId: 1 });
CallSchema.index({ initiator: 1 });
CallSchema.index({ "participants.user": 1 });
CallSchema.index({ status: 1 });
CallSchema.index({ createdAt: -1 });

// Virtual for active participants count
CallSchema.virtual('activeParticipantsCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Virtual for call duration
CallSchema.virtual('callDuration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.floor((this.endTime - this.startTime) / 1000);
  }
  return 0;
});

module.exports = mongoose.model("Call", CallSchema);
