/*
const express = require('express');
const multer = require('multer');
const Video = require('../models/Video');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Upload video (admin only)
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { title, description, assignedTo } = req.body;
    const assignedUsers = JSON.parse(assignedTo || '[]');
    
    const video = new Video({
      title,
      description,
      filename: req.file.filename,
      assignedTo: assignedUsers,
      uploadedBy: req.user.userId
    });
    
    await video.save();
    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get videos for current user
router.get('/my-videos', auth, async (req, res) => {
  try {
    let videos;
    if (req.user.role === 'admin') {
      videos = await Video.find({ uploadedBy: req.user.userId })
        .populate('assignedTo', 'name email');
    } else {
      videos = await Video.find({ assignedTo: req.user.userId });
    }
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all patients (admin only)
router.get('/patients', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const patients = await User.find({ role: 'patient' }).select('_id name email');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admin user (for patients to chat with)
router.get('/admin', auth, async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('_id name email');
    if (!admin) {
      return res.status(404).json({ message: 'No admin found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users for admin (to see who they can chat with)
router.get('/chat-users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const users = await User.find({ role: 'patient' }).select('_id name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
*/

//deepseek
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check if file is a video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload video (admin only)
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { title, description, assignedTo } = req.body;
    const assignedUsers = JSON.parse(assignedTo || '[]');
    
    // Create full video URL - FIXED: Use your actual backend URL
    const videoUrl = `https://physio-backend.onrender.com/uploads/${req.file.filename}`;
    
    const video = new Video({
      title,
      description,
      filename: req.file.filename,
      videoUrl: videoUrl, // ADD THIS FIELD
      assignedTo: assignedUsers,
      uploadedBy: req.user.userId
    });
    
    await video.save();
    
    // Populate and return with full details including URL
    const videoWithDetails = await Video.findById(video._id)
      .populate('assignedTo', 'name email')
      .populate('uploadedBy', 'name');
    
    res.status(201).json(videoWithDetails);
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Get videos for current user - UPDATED: Include videoUrl
router.get('/my-videos', auth, async (req, res) => {
  try {
    let videos;
    if (req.user.role === 'admin') {
      videos = await Video.find({ uploadedBy: req.user.userId })
        .populate('assignedTo', 'name email')
        .populate('uploadedBy', 'name');
    } else {
      videos = await Video.find({ assignedTo: req.user.userId })
        .populate('uploadedBy', 'name');
    }
    
    // Ensure all videos have videoUrl
    const videosWithUrls = videos.map(video => {
      if (!video.videoUrl) {
        video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
      }
      return video;
    });
    
    res.json(videosWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all patients (admin only)
router.get('/patients', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const patients = await User.find({ role: 'patient' }).select('_id name email');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admin user (for patients to chat with)
router.get('/admin', auth, async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('_id name email');
    if (!admin) {
      return res.status(404).json({ message: 'No admin found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users for admin (to see who they can chat with)
router.get('/chat-users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const users = await User.find({ role: 'patient' }).select('_id name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW: Test if a video is accessible
router.get('/test/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const videoPath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ 
        message: 'Video file not found on server',
        filename: filename,
        accessible: false
      });
    }
    
    res.json({
      filename: filename,
      url: `https://physio-backend.onrender.com/uploads/${filename}`,
      accessible: true,
      message: 'Video is accessible'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW: Migrate existing videos to include videoUrl
router.get('/migrate-videos', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const videos = await Video.find({ videoUrl: { $exists: false } });
    let updatedCount = 0;
    
    for (let video of videos) {
      video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
      await video.save();
      updatedCount++;
    }
    
    res.json({ 
      message: `Updated ${updatedCount} videos with videoUrl`,
      updated: updatedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW: Get video by ID with full URL
router.get('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('uploadedBy', 'name');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Ensure video has URL
    if (!video.videoUrl) {
      video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
    }
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;