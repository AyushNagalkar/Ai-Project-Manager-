const Task = require('../models/Task');
const Project = require('../models/Project');

// Create new task
exports.createTask = async (req, res) => {
  try {
    const { projectId, title, description, priority, status, deadline, phase, estimatedHours, requiredSkills, assignedTo } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ message: 'projectId and title are required' });
    }

    // Verify project exists and user is a member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = new Task({
      projectId,
      title,
      description,
      priority: priority || 'medium',
      status: status || 'todo',
      deadline,
      phase,
      estimatedHours: estimatedHours || 0,
      requiredSkills: requiredSkills || [],
      assignedTo: assignedTo || null
    });

    await task.save();
    await task.populate('assignedTo', 'name email');
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by project
exports.getTasksByProject = async (req, res) => {
  try {
    // Verify user is a member of the project
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'name email skills')
      .populate('completedBy', 'name email')
      .sort({ phase: 1, priority: -1, createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email skills')
      .populate('completedBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user is a member of the project
    const project = await Project.findById(task.projectId);
    if (!project || !project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedUpdates = ['title', 'description', 'priority', 'status', 'deadline', 'phase', 'estimatedHours', 'requiredSkills', 'assignedTo'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');
    
    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark task as complete (leader or assigned student only)
exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ message: 'Task is already completed' });
    }

    // Check permissions: leader OR assigned member
    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isLeader = project.isLeader(req.userId);
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.userId.toString();

    if (!isLeader && !isAssigned) {
      return res.status(403).json({ 
        message: 'Only the project leader or the assigned student can mark this task as done' 
      });
    }

    task.status = 'completed';
    task.completedBy = req.userId;
    task.completedAt = new Date();
    await task.save();

    await task.populate('assignedTo', 'name email');
    await task.populate('completedBy', 'name email');

    res.json({
      message: 'Task marked as completed',
      task
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Uncomplete task (reopen — leader only)
exports.uncompleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project || !project.isLeader(req.userId)) {
      return res.status(403).json({ message: 'Only the project leader can reopen tasks' });
    }

    task.status = 'todo';
    task.completedBy = null;
    task.completedAt = null;
    await task.save();

    res.json({ message: 'Task reopened', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task (leader only)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project || !project.isLeader(req.userId)) {
      return res.status(403).json({ message: 'Only the project leader can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
