const mongoose = require('mongoose');

const agentOutputSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  agentName: {
    type: String,
    required: true,
    enum: ['planner', 'research', 'monitor', 'documentation']
  },
  outputJSON: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    executionTime: Number,
    tokenUsage: Number,
    version: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AgentOutput', agentOutputSchema);
