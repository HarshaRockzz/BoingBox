const mongoose = require("mongoose");

const MediaSchema = mongoose.Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document'],
      required: true
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'completed', 'failed'],
      default: 'uploading'
    },
    urls: {
      original: String,
      thumbnail: String,
      preview: String,
      waveform: String, // for audio files
      optimized: String
    },
    metadata: {
      width: Number,
      height: Number,
      duration: Number, // for video/audio
      bitrate: Number,
      fps: Number, // for video
      channels: Number, // for audio
      sampleRate: Number, // for audio
      format: String,
      codec: String
    },
    processing: {
      thumbnailGenerated: { type: Boolean, default: false },
      waveformGenerated: { type: Boolean, default: false },
      optimized: { type: Boolean, default: false },
      error: String,
      processingTime: Number
    },
    permissions: {
      public: { type: Boolean, default: false },
      allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
      allowedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }]
    },
    usage: {
      messageCount: { type: Number, default: 0 },
      storyCount: { type: Number, default: 0 },
      lastUsed: Date
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Default to 30 days from creation
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
MediaSchema.index({ fileId: 1 });
MediaSchema.index({ uploader: 1 });
MediaSchema.index({ type: 1 });
MediaSchema.index({ status: 1 });
MediaSchema.index({ expiresAt: 1 });
MediaSchema.index({ createdAt: -1 });

// Virtual for file extension
MediaSchema.virtual('extension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for file size in human readable format
MediaSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for duration in human readable format
MediaSchema.virtual('durationFormatted').get(function() {
  if (!this.metadata.duration) return null;
  const seconds = Math.floor(this.metadata.duration);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
});

// Check if file is expired
MediaSchema.virtual('isExpired').get(function() {
  return Date.now() > this.expiresAt;
});

// Auto-delete expired files (runs daily)
MediaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Media", MediaSchema);
