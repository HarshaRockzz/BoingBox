const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      type: { 
        type: String, 
        enum: ['text', 'image', 'video', 'audio', 'document', 'emoji'], 
        default: 'text' 
      },
      text: { type: String, required: false },
      media: {
        url: String,
        thumbnail: String,
        filename: String,
        size: Number,
        mimeType: String,
        duration: Number, // for audio/video
        waveform: String, // for audio
        dimensions: {
          width: Number,
          height: Number
        }
      }
    },
    users: Array,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    chatType: {
      type: String,
      enum: ['private', 'group'],
      default: 'private'
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: false
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Messages",
      required: false
    },
    edited: {
      isEdited: { type: Boolean, default: false },
      editedAt: Date,
      originalText: String
    },
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      emoji: String,
      createdAt: { type: Date, default: Date.now }
    }],
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      readAt: { type: Date, default: Date.now }
    }],
    deliveredTo: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      deliveredAt: { type: Date, default: Date.now }
    }],
    deleted: {
      isDeleted: { type: Boolean, default: false },
      deletedAt: Date,
      deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" }
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
MessageSchema.index({ users: 1, createdAt: -1 });
MessageSchema.index({ groupId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model("Messages", MessageSchema);
