const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Agent execution endpoints
router.post('/planner', agentController.callPlannerAgent);
router.post('/research', agentController.callResearchAgent);
router.post('/monitor', agentController.callMonitorAgent);
router.post('/documentation', agentController.callDocumentationAgent);

// Get agent outputs
router.get('/outputs/:projectId', agentController.getAgentOutputs);

// Get documents
router.get('/documents/:projectId', agentController.getDocuments);

// Get progress logs
router.get('/progress/:projectId', agentController.getProgressLogs);

module.exports = router;
