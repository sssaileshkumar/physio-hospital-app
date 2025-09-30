
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Can assign either individual videos OR modules
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  dueDate: {
    type: Date
  },
  notes: String,
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed'],
    default: 'assigned'
  },
  progress: {
    completedVideos: [{
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    completedModules: [{
      module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);