const Media = require("../models/mediaModel");
const User = require("../models/userModel");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;

// Media processing queue (in production, use Redis or a proper job queue)
const processingQueue = [];

module.exports.generateUploadUrl = async (req, res, next) => {
  try {
    const { userId, fileName, fileSize, mimeType, fileType } = req.body;
    
    console.log(`📁 Generating upload URL: ${fileName} (${fileSize} bytes)`);
    
    if (!userId || !fileName || !fileSize || !mimeType || !fileType) {
      return res.status(400).json({ 
        msg: "All fields are required", 
        status: false 
      });
    }

    // Validate file type
    const allowedTypes = ['image', 'video', 'audio', 'document'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ 
        msg: "Invalid file type", 
        status: false 
      });
    }

    // Check file size limits
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 50 * 1024 * 1024, // 50MB
      document: 25 * 1024 * 1024 // 25MB
    };

    if (fileSize > maxSizes[fileType]) {
      return res.status(400).json({ 
        msg: `File size exceeds limit for ${fileType} files`, 
        status: false 
      });
    }

    // Generate unique file ID
    const fileId = crypto.randomBytes(16).toString('hex');
    
    // Create media record
    const mediaData = {
      fileId,
      originalName: fileName,
      mimeType,
      size: fileSize,
      type: fileType,
      uploader: userId,
      status: 'uploading'
    };

    const media = await Media.create(mediaData);
    
    // Generate signed upload URL (in production, use cloud storage like AWS S3)
    const uploadUrl = `/api/media/upload/${fileId}`;
    const uploadToken = crypto.randomBytes(32).toString('hex');
    
    // Store upload token (in production, use Redis with expiration)
    media.uploadToken = uploadToken;
    await media.save();
    
    console.log("✅ Upload URL generated successfully");
    
    res.json({ 
      status: true, 
      msg: "Upload URL generated successfully.",
      data: {
        fileId,
        uploadUrl,
        uploadToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });
  } catch (ex) {
    console.error("🚨 Generate upload URL error:", ex);
    next(ex);
  }
};

module.exports.uploadFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { uploadToken } = req.headers;
    
    console.log(`📁 Processing file upload: ${fileId}`);
    
    if (!fileId || !uploadToken) {
      return res.status(400).json({ 
        msg: "File ID and upload token are required", 
        status: false 
      });
    }

    const media = await Media.findOne({ fileId });
    
    if (!media) {
      return res.status(404).json({ 
        msg: "Media not found", 
        status: false 
      });
    }

    if (media.status !== 'uploading') {
      return res.status(400).json({ 
        msg: "File is not in uploading state", 
        status: false 
      });
    }

    // Validate upload token (in production, use proper token validation)
    if (media.uploadToken !== uploadToken) {
      return res.status(403).json({ 
        msg: "Invalid upload token", 
        status: false 
      });
    }

    // Handle file upload (in production, use cloud storage)
    if (!req.file) {
      return res.status(400).json({ 
        msg: "No file uploaded", 
        status: false 
      });
    }

    // Update media record with file information
    media.status = 'processing';
    media.urls.original = `/uploads/${fileId}/${req.file.filename}`;
    media.processing.uploadedAt = new Date();
    
    await media.save();
    
    // Add to processing queue
    processingQueue.push({
      mediaId: media._id,
      filePath: req.file.path,
      type: media.type
    });
    
    // Process media in background
    processMediaQueue();
    
    console.log("✅ File uploaded successfully");
    
    res.json({ 
      status: true, 
      msg: "File uploaded successfully.",
      data: {
        fileId,
        status: 'processing',
        estimatedTime: getEstimatedProcessingTime(media.type)
      }
    });
  } catch (ex) {
    console.error("🚨 Upload file error:", ex);
    next(ex);
  }
};

module.exports.getMediaStatus = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    
    console.log(`📁 Getting media status: ${fileId}`);
    
    if (!fileId) {
      return res.status(400).json({ 
        msg: "File ID is required", 
        status: false 
      });
    }

    const media = await Media.findOne({ fileId })
      .populate('uploader', 'username avatarImage');
    
    if (!media) {
      return res.status(404).json({ 
        msg: "Media not found", 
        status: false 
      });
    }
    
    console.log("✅ Media status retrieved successfully");
    
    res.json({ 
      status: true, 
      msg: "Media status retrieved successfully.",
      data: media
    });
  } catch (ex) {
    console.error("🚨 Get media status error:", ex);
    next(ex);
  }
};

module.exports.getSignedUrl = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { userId, purpose = 'view' } = req.query;
    
    console.log(`📁 Generating signed URL: ${fileId} for ${purpose}`);
    
    if (!fileId) {
      return res.status(400).json({ 
        msg: "File ID is required", 
        status: false 
      });
    }

    const media = await Media.findOne({ fileId });
    
    if (!media) {
      return res.status(404).json({ 
        msg: "Media not found", 
        status: false 
      });
    }

    // Check permissions
    if (!media.permissions.public && media.uploader.toString() !== userId) {
      // Check if user is in allowed users/groups
      const isAllowed = media.permissions.allowedUsers.includes(userId) ||
                       media.permissions.allowedGroups.some(groupId => 
                         // Check if user is member of group (implement group membership check)
                         true // Placeholder
                       );
      
      if (!isAllowed) {
        return res.status(403).json({ 
          msg: "Access denied", 
          status: false 
        });
      }
    }

    // Generate signed URL (in production, use cloud storage signed URLs)
    const signedUrl = `${media.urls.original}?token=${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    console.log("✅ Signed URL generated successfully");
    
    res.json({ 
      status: true, 
      msg: "Signed URL generated successfully.",
      data: {
        url: signedUrl,
        expiresAt,
        type: media.type,
        size: media.size
      }
    });
  } catch (ex) {
    console.error("🚨 Generate signed URL error:", ex);
    next(ex);
  }
};

module.exports.deleteMedia = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;
    
    console.log(`📁 Deleting media: ${fileId} by user ${userId}`);
    
    if (!fileId || !userId) {
      return res.status(400).json({ 
        msg: "File ID and user ID are required", 
        status: false 
      });
    }

    const media = await Media.findOne({ fileId });
    
    if (!media) {
      return res.status(404).json({ 
        msg: "Media not found", 
        status: false 
      });
    }

    // Only uploader can delete
    if (media.uploader.toString() !== userId) {
      return res.status(403).json({ 
        msg: "You can only delete your own media", 
        status: false 
      });
    }

    // Delete files from storage (in production, use cloud storage)
    try {
      await fs.unlink(media.urls.original);
      if (media.urls.thumbnail) await fs.unlink(media.urls.thumbnail);
      if (media.urls.preview) await fs.unlink(media.urls.preview);
      if (media.urls.waveform) await fs.unlink(media.urls.waveform);
      if (media.urls.optimized) await fs.unlink(media.urls.optimized);
    } catch (error) {
      console.warn("Warning: Could not delete some files:", error);
    }

    await Media.findByIdAndDelete(media._id);
    
    console.log("✅ Media deleted successfully");
    
    res.json({ 
      status: true, 
      msg: "Media deleted successfully." 
    });
  } catch (ex) {
    console.error("🚨 Delete media error:", ex);
    next(ex);
  }
};

module.exports.getUserMedia = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    console.log(`📁 Getting user media: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    const skip = (page - 1) * limit;
    const query = { uploader: userId };
    
    if (type) {
      query.type = type;
    }

    const media = await Media.find(query)
      .populate('uploader', 'username avatarImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Media.countDocuments(query);
    
    console.log(`✅ Found ${media.length} media files`);
    
    res.json({ 
      status: true, 
      msg: "User media retrieved successfully.",
      data: {
        media,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (ex) {
    console.error("🚨 Get user media error:", ex);
    next(ex);
  }
};

// Background processing functions
async function processMediaQueue() {
  if (processingQueue.length === 0) return;
  
  const item = processingQueue.shift();
  
  try {
    const media = await Media.findById(item.mediaId);
    if (!media) return;

    media.status = 'processing';
    await media.save();

    const startTime = Date.now();

    // Process based on file type
    switch (item.type) {
      case 'image':
        await processImage(media, item.filePath);
        break;
      case 'video':
        await processVideo(media, item.filePath);
        break;
      case 'audio':
        await processAudio(media, item.filePath);
        break;
      case 'document':
        await processDocument(media, item.filePath);
        break;
    }

    media.status = 'completed';
    media.processing.processingTime = Date.now() - startTime;
    await media.save();

    console.log(`✅ Media processing completed: ${media.fileId}`);
  } catch (error) {
    console.error(`❌ Media processing failed: ${item.mediaId}`, error);
    
    const media = await Media.findById(item.mediaId);
    if (media) {
      media.status = 'failed';
      media.processing.error = error.message;
      await media.save();
    }
  }

  // Process next item
  setTimeout(processMediaQueue, 1000);
}

async function processImage(media, filePath) {
  // Generate thumbnail
  // In production, use sharp or similar library
  media.urls.thumbnail = filePath.replace('.', '_thumb.');
  media.processing.thumbnailGenerated = true;
  
  // Extract metadata
  // In production, use exif-reader or similar
  media.metadata.width = 1920; // Placeholder
  media.metadata.height = 1080; // Placeholder
  media.metadata.format = 'JPEG'; // Placeholder
}

async function processVideo(media, filePath) {
  // Generate thumbnail
  media.urls.thumbnail = filePath.replace('.', '_thumb.');
  media.processing.thumbnailGenerated = true;
  
  // Generate preview
  media.urls.preview = filePath.replace('.', '_preview.');
  
  // Extract metadata
  // In production, use ffprobe or similar
  media.metadata.width = 1920; // Placeholder
  media.metadata.height = 1080; // Placeholder
  media.metadata.duration = 60; // Placeholder
  media.metadata.fps = 30; // Placeholder
  media.metadata.format = 'MP4'; // Placeholder
}

async function processAudio(media, filePath) {
  // Generate waveform
  media.urls.waveform = filePath.replace('.', '_waveform.');
  media.processing.waveformGenerated = true;
  
  // Extract metadata
  // In production, use ffprobe or similar
  media.metadata.duration = 180; // Placeholder
  media.metadata.channels = 2; // Placeholder
  media.metadata.sampleRate = 44100; // Placeholder
  media.metadata.format = 'MP3'; // Placeholder
}

async function processDocument(media, filePath) {
  // Generate preview (first page for PDFs, etc.)
  media.urls.preview = filePath.replace('.', '_preview.');
  
  // Extract metadata
  media.metadata.format = path.extname(media.originalName).toUpperCase();
}

function getEstimatedProcessingTime(type) {
  const estimates = {
    image: 5, // seconds
    video: 30,
    audio: 15,
    document: 10
  };
  return estimates[type] || 10;
}
