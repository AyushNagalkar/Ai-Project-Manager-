const mongoose = require('mongoose');

const progressLogSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  completionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  risks: [{
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    mitigation: String
  }],
  delays: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    expectedDate: Date,
    actualDate: Date,
    reason: String
  }],
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ProgressLog', progressLogSchema);
