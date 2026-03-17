const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.post('/', taskController.createTask);
router.get('/project/:projectId', taskController.getTasksByProject);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.patch('/:id/complete', taskController.completeTask);
router.patch('/:id/uncomplete', taskController.uncompleteTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
