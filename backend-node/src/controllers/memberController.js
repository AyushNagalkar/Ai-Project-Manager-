const User = require('../models/User');
const Project = require('../models/Project');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Add a member to the project (leader only)
exports.addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isLeader(req.userId)) {
      return res.status(403).json({ message: 'Only the project leader can add members' });
    }

    const { name, email, age, contact, skills, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create a new user account with default password
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = password || 'smartpm123'; // Default password when leader adds member
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      user = new User({
        name,
        email: email.toLowerCase(),
        passwordHash,
        age: age || null,
        contact: contact || '',
        skills: skills || []
      });
      await user.save();
    } else {
      // Update existing user's info if provided
      if (age) user.age = age;
      if (contact) user.contact = contact;
      if (skills && skills.length > 0) {
        // Merge skills (avoid duplicates)
        const existingSkills = user.skills.map(s => s.toLowerCase());
        const newSkills = skills.filter(s => !existingSkills.includes(s.toLowerCase()));
        user.skills = [...user.skills, ...newSkills];
      }
      await user.save();
    }

    // Check if already a member
    const alreadyMember = project.teamMembers.some(
      m => m.user.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    // Add to project
    project.teamMembers.push({
      user: user._id,
      role: 'member',
      addedAt: new Date()
    });

    await project.save();
    await project.populate('teamMembers.user', 'name email skills age contact');

    res.status(201).json({
      message: `${name} added to the project successfully`,
      project
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload resume and parse with OCR service
exports.uploadResume = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isLeader(req.userId)) {
      return res.status(403).json({ message: 'Only the project leader can upload resumes' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const filePath = req.file.path;

    try {
      // Call Python OCR service
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), {
        filename: req.file.originalname,
        contentType: 'application/pdf'
      });

      const ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://localhost:8005';
      const ocrResponse = await axios.post(`${ocrServiceUrl}/parse-resume`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });

      const extractedData = ocrResponse.data;

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        message: 'Resume parsed successfully',
        extracted: extractedData
      });
    } catch (ocrError) {
      // Clean up uploaded file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.error('OCR service error:', ocrError.message);
      res.status(500).json({ 
        message: 'Failed to parse resume. Make sure the OCR service is running.',
        error: ocrError.message 
      });
    }
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get project members
exports.getMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('teamMembers.user', 'name email skills age contact education experience resumeUrl');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project.teamMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove member from project (leader only)
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isLeader(req.userId)) {
      return res.status(403).json({ message: 'Only the project leader can remove members' });
    }

    const memberUserId = req.params.userId;

    // Cannot remove the leader
    const member = project.teamMembers.find(m => m.user.toString() === memberUserId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found in this project' });
    }

    if (member.role === 'leader') {
      return res.status(400).json({ message: 'Cannot remove the project leader' });
    }

    project.teamMembers = project.teamMembers.filter(
      m => m.user.toString() !== memberUserId
    );

    await project.save();
    await project.populate('teamMembers.user', 'name email skills');

    res.json({
      message: 'Member removed successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
