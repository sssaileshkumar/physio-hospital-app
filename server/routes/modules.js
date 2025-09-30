
const express = require('express');
const Module = require('../models/Module');
const Video = require('../models/Video');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');
const router = express.Router();

// Create new module (admin only)
router.post('/create', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, category, difficulty, duration, tags } = req.body;

    const module = new Module({
      name,
      description,
      category,
      difficulty,
      duration,
      tags: tags || [],
      createdBy: req.user.userId
    });

    await module.save();
    res.status(201).json(module);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all modules (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const modules = await Module.find({ createdBy: req.user.userId, isActive: true })
      .populate('videos')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single module with videos
router.get('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate({
        path: 'videos',
        options: { sort: { order: 1 } }
      })
      .populate('createdBy', 'name');

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Check if user has access
    if (req.user.role !== 'admin') {
      const assignment = await Assignment.findOne({
        patient: req.user.userId,
        modules: module._id
      });
      
      if (!assignment) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(module);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add videos to module
router.post('/:id/add-videos', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { videoIds } = req.body;
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Add videos to module and update their order
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      
      // Update video with module reference and order
      await Video.findByIdAndUpdate(videoId, {
        $addToSet: { modules: module._id },
        order: module.videos.length + i
      });

      // Add to module if not already there
      if (!module.videos.includes(videoId)) {
        module.videos.push(videoId);
      }
    }

    await module.save();
    
    const updatedModule = await Module.findById(req.params.id)
      .populate('videos');
    
    res.json(updatedModule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove video from module
router.delete('/:moduleId/videos/:videoId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { moduleId, videoId } = req.params;

    // Remove from module
    await Module.findByIdAndUpdate(moduleId, {
      $pull: { videos: videoId }
    });

    // Remove module reference from video
    await Video.findByIdAndUpdate(videoId, {
      $pull: { modules: moduleId }
    });

    res.json({ message: 'Video removed from module' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign module to patients
router.post('/:id/assign', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { patientIds, dueDate, notes } = req.body;
    const moduleId = req.params.id;

    const assignments = [];

    for (const patientId of patientIds) {
      let assignment = await Assignment.findOne({ patient: patientId });

      if (assignment) {
        // Add module to existing assignment
        if (!assignment.modules.includes(moduleId)) {
          assignment.modules.push(moduleId);
          assignment.notes = notes || assignment.notes;
          assignment.dueDate = dueDate || assignment.dueDate;
          await assignment.save();
        }
      } else {
        // Create new assignment
        assignment = new Assignment({
          patient: patientId,
          assignedBy: req.user.userId,
          modules: [moduleId],
          dueDate,
          notes
        });
        await assignment.save();
      }

      assignments.push(assignment);
    }

    res.json({ message: 'Module assigned successfully', assignments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient's assigned modules
router.get('/patient/assigned', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ patient: req.user.userId })
      .populate({
        path: 'modules',
        populate: {
          path: 'videos',
          options: { sort: { order: 1 } }
        }
      })
      .populate('assignedBy', 'name');

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark video as completed
router.post('/progress/video/:videoId', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ patient: req.user.userId });
    
    if (!assignment) {
      return res.status(404).json({ message: 'No assignment found' });
    }

    // Check if already completed
    const alreadyCompleted = assignment.progress.completedVideos.some(
      cv => cv.video.toString() === req.params.videoId
    );

    if (!alreadyCompleted) {
      assignment.progress.completedVideos.push({
        video: req.params.videoId,
        completedAt: new Date()
      });
      await assignment.save();
    }

    res.json({ message: 'Video marked as completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;