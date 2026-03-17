const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['leader', 'member'],
    default: 'member'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    trim: true
  },
  problemStatement: {
    type: String
  },
  deadline: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'archived'],
    default: 'planning'
  },
  teamMembers: [teamMemberSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Track if monitor agent is scheduled
  monitorScheduleEnabled: {
    type: Boolean,
    default: true
  },
  lastMonitorRun: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for finding projects a user belongs to
projectSchema.index({ 'teamMembers.user': 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });

// Helper: get the user ID string (handles both populated and unpopulated)
function getUserId(member) {
  if (!member.user) return null;
  // If populated, user is an object with _id
  if (member.user._id) return member.user._id.toString();
  // If not populated, user is an ObjectId
  return member.user.toString();
}

// Helper: check if a user is the leader
projectSchema.methods.isLeader = function(userId) {
  const uid = userId.toString();
  return this.teamMembers.some(
    m => getUserId(m) === uid && m.role === 'leader'
  );
};

// Helper: check if a user is a member (leader or member)
projectSchema.methods.isMember = function(userId) {
  const uid = userId.toString();
  return this.teamMembers.some(
    m => getUserId(m) === uid
  );
};

module.exports = mongoose.model('Project', projectSchema);
