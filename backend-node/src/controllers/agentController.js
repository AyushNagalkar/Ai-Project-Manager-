const axios = require('axios');
const AgentOutput = require('../models/AgentOutput');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ProgressLog = require('../models/ProgressLog');
const Document = require('../models/Document');

// Call Planner Agent
exports.callPlannerAgent = async (req, res) => {
  try {
    const { projectId } = req.body;

    const project = await Project.findById(projectId)
      .populate('teamMembers.user', 'name email skills');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const memberNames = project.teamMembers.map(m => m.user.name);

    const response = await axios.post(
      `${process.env.PLANNER_SERVICE_URL}/plan`,
      {
        projectTitle: project.name,
        domain: project.domain || 'General',
        problemStatement: project.problemStatement || project.description,
        teamMembers: memberNames
      },
      { timeout: 120000 }
    );
    
    // Save agent output
    const agentOutput = new AgentOutput({
      projectId,
      agentName: 'planner',
      outputJSON: response.data
    });
    await agentOutput.save();

    // Create tasks from planner output phases
    const phases = response.data.phases || [];
    let taskCount = 0;

    // Get members for skill-based assignment
    const membersForAssignment = project.teamMembers.map(m => ({
      userId: m.user._id,
      skills: m.user.skills || []
    }));

    // Use the shared skill-based assignment (from projectController)
    const { assignTasksToMembers } = require('./projectController');

    for (const phase of phases) {
      const phaseTasks = (phase.tasks || []).map(t => ({ ...t, phase: phase.name }));
      const assigned = assignTasksToMembers(phaseTasks, membersForAssignment);

      for (const taskData of assigned) {
        const task = new Task({
          projectId,
          title: taskData.title,
          description: taskData.description,
          phase: taskData.phase || phase.name,
          priority: taskData.priority || 'medium',
          estimatedHours: taskData.estimatedHours || 0,
          requiredSkills: taskData.requiredSkills || [],
          assignedTo: taskData.assignedTo || null,
          status: 'todo'
        });
        await task.save();
        taskCount++;
      }
    }
    
    res.json({
      message: `Planner agent completed. Created ${taskCount} tasks across ${phases.length} phases.`,
      data: response.data,
      outputId: agentOutput._id
    });
  } catch (error) {
    console.error('Planner agent error:', error.message);
    res.status(500).json({ message: 'Planner agent error', error: error.message });
  }
};

// Call Research Agent
exports.callResearchAgent = async (req, res) => {
  try {
    const { projectId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const response = await axios.post(
      `${process.env.RESEARCH_SERVICE_URL}/research`,
      {
        domain: project.domain || 'General',
        keywords: [project.name, project.domain, project.problemStatement].filter(Boolean)
      },
      { timeout: 120000 }
    );
    
    const agentOutput = new AgentOutput({
      projectId,
      agentName: 'research',
      outputJSON: response.data
    });
    await agentOutput.save();
    
    res.json({
      message: 'Research agent completed successfully',
      data: response.data,
      outputId: agentOutput._id
    });
  } catch (error) {
    console.error('Research agent error:', error.message);
    res.status(500).json({ message: 'Research agent error', error: error.message });
  }
};

// Call Monitor Agent
exports.callMonitorAgent = async (req, res) => {
  try {
    const { projectId } = req.body;

    const project = await Project.findById(projectId)
      .populate('teamMembers.user', 'name email skills');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'name email');

    // Build member performance data
    const memberPerf = project.teamMembers.map(m => {
      const memberTasks = tasks.filter(t => 
        t.assignedTo && t.assignedTo._id.toString() === m.user._id.toString()
      );
      return {
        memberEmail: m.user.email,
        memberName: m.user.name,
        tasksAssigned: memberTasks.length,
        tasksCompleted: memberTasks.filter(t => t.status === 'completed').length
      };
    });

    const response = await axios.post(
      `${process.env.MONITOR_SERVICE_URL}/monitor`,
      {
        tasks: tasks.map(t => ({
          title: t.title,
          status: t.status,
          deadline: t.deadline ? t.deadline.toISOString() : null,
          assignedTo: t.assignedTo ? t.assignedTo.name : 'Unassigned',
          phase: t.phase || ''
        })),
        progressLogs: [],
        memberPerformance: memberPerf,
        projectDeadline: project.deadline ? project.deadline.toISOString() : null
      },
      { timeout: 60000 }
    );
    
    const agentOutput = new AgentOutput({
      projectId,
      agentName: 'monitor',
      outputJSON: response.data
    });
    await agentOutput.save();

    // Save progress log
    const progressLog = new ProgressLog({
      projectId,
      completionPercentage: response.data.progress || 0,
      risks: response.data.risks || [],
      delays: response.data.delays || [],
      notes: JSON.stringify(response.data.insights || [])
    });
    await progressLog.save();

    // Update last monitor run timestamp
    project.lastMonitorRun = new Date();
    await project.save();
    
    res.json({
      message: 'Monitor agent completed successfully',
      data: response.data,
      outputId: agentOutput._id
    });
  } catch (error) {
    console.error('Monitor agent error:', error.message);
    res.status(500).json({ message: 'Monitor agent error', error: error.message });
  }
};

// Call Documentation Agent
exports.callDocumentationAgent = async (req, res) => {
  try {
    const { projectId, docType } = req.body;
    // docType can be: 'report', 'ppt_content', 'viva_questions', 'readme', or undefined for all

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ projectId });
    const researchOutput = await AgentOutput.findOne({ projectId, agentName: 'research' })
      .sort({ createdAt: -1 });

    const response = await axios.post(
      `${process.env.DOC_SERVICE_URL}/generate-docs`,
      {
        project: {
          title: project.name,
          domain: project.domain || 'General',
          problemStatement: project.problemStatement || project.description
        },
        tasks: tasks.map(t => ({
          title: t.title,
          description: t.description,
          status: t.status,
          phase: t.phase || ''
        })),
        research: researchOutput ? researchOutput.outputJSON : { papers: [], tools: [] },
        docType: docType || 'all'
      },
      { timeout: 180000 }
    );
    
    const agentOutput = new AgentOutput({
      projectId,
      agentName: 'documentation',
      outputJSON: response.data
    });
    await agentOutput.save();

    // Generate date string for title
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    // Save as documents — ALWAYS APPEND, never overwrite
    const docData = response.data;
    if (docData.exportFormats) {
      for (const [format, content] of Object.entries(docData.exportFormats)) {
        // If docType is specified, only save the requested format
        if (docType && docType !== 'all' && format !== docType) continue;

        const doc = new Document({
          projectId,
          type: format,
          title: `${project.name} — ${format.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()} (${dateStr})`,
          content,
          format: 'markdown',
          generatedBy: 'documentation_agent'
        });
        await doc.save();
      }
    }
    
    res.json({
      message: 'Documentation agent completed successfully',
      data: response.data,
      outputId: agentOutput._id
    });
  } catch (error) {
    console.error('Documentation agent error:', error.message);
    res.status(500).json({ message: 'Documentation agent error', error: error.message });
  }
};

// Get agent outputs by project (latest per agent)
exports.getAgentOutputs = async (req, res) => {
  try {
    // Get latest output for each agent using aggregation
    const outputs = await AgentOutput.aggregate([
      { $match: { projectId: new (require('mongoose').Types.ObjectId)(req.params.projectId) } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: '$agentName',
        doc: { $first: '$$ROOT' }
      }},
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { agentName: 1 } }
    ]);
    
    res.json(outputs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get documents by project
exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      projectId: req.params.projectId
    }).sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get progress logs
exports.getProgressLogs = async (req, res) => {
  try {
    const logs = await ProgressLog.find({
      projectId: req.params.projectId
    }).sort({ createdAt: -1 }).limit(20);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
