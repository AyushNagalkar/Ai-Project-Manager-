const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    min: 10,
    max: 100
  },
  contact: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  education: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  resumeUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Index for fast email lookups (login)
userSchema.index({ email: 1 }, { unique: true });
// Index for skill-based queries
userSchema.index({ skills: 1 });

module.exports = mongoose.model('User', userSchema);
