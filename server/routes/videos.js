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

/*
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
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Clean filename and add timestamp
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + originalName);
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
    console.log('Upload request received:', {
      user: req.user,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file',
      body: req.body
    });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    const { title, description, assignedTo } = req.body;
    const assignedUsers = JSON.parse(assignedTo || '[]');
    
    // Use your actual deployed backend URL - FIXED
    const videoUrl = `https://physio-backend.onrender.com/uploads/${req.file.filename}`;
    
    console.log('Creating video with URL:', videoUrl);
    
    const video = new Video({
      title: title || 'Untitled Video',
      description: description || '',
      filename: req.file.filename,
      videoUrl: videoUrl, // This field was missing!
      assignedTo: assignedUsers,
      uploadedBy: req.user.userId
    });
    
    await video.save();
    console.log('Video saved to database:', video._id);
    
    // Populate and return the video
    const videoWithDetails = await Video.findById(video._id)
      .populate('assignedTo', 'name email')
      .populate('uploadedBy', 'name');
    
    res.status(201).json(videoWithDetails);
    
  } catch (error) {
    console.error('Upload error details:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      file: req.file
    });
    
    // Clean up uploaded file if there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
});

// Get videos for current user
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
    
    // Ensure all videos have correct videoUrl
    const videosWithUrls = videos.map(video => {
      if (!video.videoUrl || video.videoUrl.includes('localhost')) {
        video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
      }
      return video;
    });
    
    res.json(videosWithUrls);
  } catch (error) {
    console.error('Error fetching videos:', error);
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
    console.error('Error fetching patients:', error);
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
    console.error('Error fetching admin:', error);
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
    console.error('Error fetching chat users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Fix video URLs for existing videos
router.get('/fix-video-urls', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const videos = await Video.find();
    let fixedCount = 0;
    
    for (let video of videos) {
      // Fix any localhost URLs to use the deployed URL
      if (video.videoUrl && video.videoUrl.includes('localhost')) {
        video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
        await video.save();
        fixedCount++;
      } else if (!video.videoUrl) {
        video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
        await video.save();
        fixedCount++;
      }
    }
    
    res.json({ 
      message: `Fixed ${fixedCount} video URLs`,
      totalVideos: videos.length,
      fixedCount: fixedCount
    });
  } catch (error) {
    console.error('Error fixing video URLs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test if a video file exists
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
    
    // Get file stats
    const stats = fs.statSync(videoPath);
    
    res.json({
      filename: filename,
      url: `https://physio-backend.onrender.com/uploads/${filename}`,
      accessible: true,
      fileSize: stats.size,
      message: 'Video is accessible'
    });
  } catch (error) {
    console.error('Error testing video:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
*/


const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Video = require('../models/Video');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'physio-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
    transformation: [{ quality: 'auto' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload video (admin only)
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    console.log('Video upload request:', req.body);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { title, description, assignedTo } = req.body;
    let assignedUsers = [];
    
    try {
      assignedUsers = assignedTo ? JSON.parse(assignedTo) : [];
    } catch (parseError) {
      console.log('Error parsing assignedTo, using empty array');
      assignedUsers = [];
    }
    
    const video = new Video({
      title,
      description: description || '',
      filename: req.file.path, // Cloudinary URL
      assignedTo: assignedUsers,
      uploadedBy: req.user.userId,
      modules: []
    });
    
    const savedVideo = await video.save();
    console.log('Video uploaded successfully:', savedVideo._id);
    
    res.status(201).json(savedVideo);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ message: error.message });
  }
});

// Rest of your routes stay the same...
// Get videos for current user
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
    
    // Ensure all videos have correct videoUrl
    const videosWithUrls = videos.map(video => {
      if (!video.videoUrl || video.videoUrl.includes('localhost')) {
        video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
      }
      return video;
    });
    
    res.json(videosWithUrls);
  } catch (error) {
    console.error('Error fetching videos:', error);
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
    console.error('Error fetching patients:', error);
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
    console.error('Error fetching admin:', error);
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
    console.error('Error fetching chat users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Fix video URLs for existing videos
router.get('/fix-video-urls', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const videos = await Video.find();
    let fixedCount = 0;
    
    for (let video of videos) {
      // Fix any localhost URLs to use the deployed URL
      if (video.videoUrl && video.videoUrl.includes('localhost')) {
        video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
        await video.save();
        fixedCount++;
      } else if (!video.videoUrl) {
        video.videoUrl = `https://physio-backend.onrender.com/uploads/${video.filename}`;
        await video.save();
        fixedCount++;
      }
    }
    
    res.json({ 
      message: `Fixed ${fixedCount} video URLs`,
      totalVideos: videos.length,
      fixedCount: fixedCount
    });
  } catch (error) {
    console.error('Error fixing video URLs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test if a video file exists
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
    
    // Get file stats
    const stats = fs.statSync(videoPath);
    
    res.json({
      filename: filename,
      url: `https://physio-backend.onrender.com/uploads/${filename}`,
      accessible: true,
      fileSize: stats.size,
      message: 'Video is accessible'
    });
  } catch (error) {
    console.error('Error testing video:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;