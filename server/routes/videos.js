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