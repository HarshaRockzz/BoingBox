const mongoose = require("mongoose");

const StorySchema = mongoose.Schema(
  {
      user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      required: true
    },
    content: {
      text: String,
      media: {
        url: String,
        thumbnail: String,
        filename: String,
        size: Number,
        mimeType: String,
        duration: Number, // for video
        dimensions: {
          width: Number,
          height: Number
        }
      }
    },
    style: {
      backgroundColor: String,
      textColor: String,
      fontSize: Number,
      fontFamily: String,
      textPosition: {
        x: Number,
        y: Number
      }
    },
      views: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    viewedAt: { type: Date, default: Date.now }
  }],
  replies: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        // Default to 24 hours from creation
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    },
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
StorySchema.index({ user: 1, createdAt: -1 });
StorySchema.index({ expiresAt: 1 });
StorySchema.index({ isActive: 1 });

// Virtual for view count
StorySchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Virtual for reply count
StorySchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Check if story is expired
StorySchema.virtual('isExpired').get(function() {
  return Date.now() > this.expiresAt;
});

// Auto-delete expired stories (runs every hour)
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", StorySchema);
