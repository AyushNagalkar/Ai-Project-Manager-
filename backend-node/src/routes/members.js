const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/auth');

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

// Member management routes (scoped to project)
router.post('/:id/members', memberController.addMember);
router.post('/:id/members/upload-resume', upload.single('resume'), memberController.uploadResume);
router.get('/:id/members', memberController.getMembers);
router.delete('/:id/members/:userId', memberController.removeMember);

module.exports = router;
