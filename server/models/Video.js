/*
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  filename: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  order: {
    type: Number, // Order within a module
    default: 0
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // NEW: Reference to modules this video belongs to
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);
*/

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  filename: {
    type: String,
    required: true
  },
  videoUrl: {  // ADD THIS FIELD - Full URL to access the video
    type: String
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  order: {
    type: Number, // Order within a module
    default: 0
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);