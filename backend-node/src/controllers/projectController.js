const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const axios = require('axios');
const AgentOutput = require('../models/AgentOutput');

// ── Skill synonym map for fuzzy matching ────────────────────────────
const SKILL_SYNONYMS = {
  'js': 'javascript', 'ts': 'typescript', 'py': 'python',
  'ml': 'machine learning', 'dl': 'deep learning', 'ai': 'artificial intelligence',
  'react': 'react.js', 'node': 'node.js', 'vue': 'vue.js', 'next': 'next.js',
  'mongo': 'mongodb', 'postgres': 'postgresql', 'mysql': 'sql',
  'css': 'css', 'html': 'html', 'sass': 'css', 'scss': 'css',
  'devops': 'ci/cd', 'aws': 'cloud', 'azure': 'cloud', 'gcp': 'cloud',
  'figma': 'ui/ux', 'sketch': 'ui/ux', 'wireframing': 'ui/ux',
  'nlp': 'natural language processing', 'cv': 'computer vision',
  'backend': 'api', 'frontend': 'ui', 'fullstack': 'full stack',
  'testing': 'qa', 'doc': 'documentation', 'docs': 'documentation',
  'presentation': 'communication',
};

function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return SKILL_SYNONYMS[lower] || lower;
}

// ── Improved skill-based task assignment ─────────────────────────────
function assignTasksToMembers(tasks, members) {
  // members: [{ userId: ObjectId, skills: [String] }]
  if (members.length === 0) return tasks;

  // Track how many tasks each member has been assigned (workload balancing)
  const workload = new Map();
  members.forEach(m => workload.set(m.userId.toString(), 0));

  return tasks.map(task => {
    const requiredSkills = (task.requiredSkills || []).map(normalizeSkill);

    let bestMatch = null;
    let bestScore = -1;

    for (const member of members) {
      const memberSkills = (member.skills || []).map(normalizeSkill);
      let score = 0;

      for (const required of requiredSkills) {
        for (const ms of memberSkills) {
          if (ms === required) {
            score += 3;  // Exact match (after normalization)
            break;
          } else if (ms.includes(required) || required.includes(ms)) {
            score += 1;  // Partial/substring match
            break;
          }
        }
      }

      // Prefer member with higher score. On tie, prefer member with fewer tasks (workload balance)
      const memberLoad = workload.get(member.userId.toString()) || 0;
      if (score > bestScore || (score === bestScore && bestMatch && memberLoad < (workload.get(bestMatch.userId.toString()) || 0))) {
        bestScore = score;
        bestMatch = member;
      }
    }

    if (bestMatch && bestScore > 0) {
      task.assignedTo = bestMatch.userId;
    } else {
      // No skill match — assign to least-loaded member (workload balancing)
      let leastLoaded = members[0];
      let minLoad = workload.get(leastLoaded.userId.toString()) || 0;
      for (const m of members) {
        const load = workload.get(m.userId.toString()) || 0;
        if (load < minLoad) {
          minLoad = load;
          leastLoaded = m;
        }
      }
      task.assignedTo = leastLoaded.userId;
      bestMatch = leastLoaded;
    }

    // Update workload counter
    if (bestMatch) {
      const key = bestMatch.userId.toString();
      workload.set(key, (workload.get(key) || 0) + 1);
    }

    return task;
  });
}

// Export the helper for use in agentController
exports.assignTasksToMembers = assignTasksToMembers;

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { name, description, domain, problemStatement, deadline, priority } = req.body;
    
    const project = new Project({
      name,
      description,
      domain,
      problemStatement,
      deadline,
      priority: priority || 'medium',
      createdBy: req.userId,
      status: 'planning',
      // Creator is automatically the leader
      teamMembers: [{
        user: req.userId,
        role: 'leader',
        addedAt: new Date()
      }]
    });
    
    await project.save();
    await project.populate('teamMembers.user', 'name email skills');
    await project.populate('createdBy', 'name email');
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all projects (only projects where user is a member)
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'teamMembers.user': req.userId
    })
      .populate('createdBy', 'name email')
      .populate('teamMembers.user', 'name email skills')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('teamMembers.user', 'name email skills age contact');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member
    if (!project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update project (leader only)
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isLeader(req.userId)) {
      return res.status(403).json({ message: 'Only the project leader can update the project' });
    }

    const allowedUpdates = ['name', 'description', 'domain', 'problemStatement', 'deadline', 'priority', 'status'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('teamMembers.user', 'name email skills');
    
    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete project (leader only)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isLeader(req.userId)) {
      return res.status(403).json({ message: 'Only the project leader can delete the project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ projectId: req.params.id });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create project with AI agent orchestration
exports.createProjectWithAgents = async (req, res) => {
  try {
    const { name, description, domain, problemStatement, deadline, priority } = req.body;
    
    if (!domain || !problemStatement) {
      return res.status(400).json({ 
        message: 'Domain and problem statement are required for AI agent processing' 
      });
    }

    // Create the project (creator = leader)
    const project = new Project({
      name,
      description,
      domain,
      problemStatement,
      deadline,
      priority: priority || 'medium',
      createdBy: req.userId,
      status: 'planning',
      teamMembers: [{
        user: req.userId,
        role: 'leader',
        addedAt: new Date()
      }]
    });
    
    await project.save();
    console.log('✅ Project created:', project._id);

    // Gather team member info (names for the planner)
    await project.populate('teamMembers.user', 'name email skills');
    const memberNames = project.teamMembers.map(m => m.user.name);

    // Trigger agent orchestration in background
    const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:8000';
    
    axios.post(`${orchestratorUrl}/orchestrate/full-pipeline`, {
      projectTitle: name,
      domain: domain,
      problemStatement: problemStatement,
      teamMembers: memberNames
    }, { timeout: 180000 })
      .then(async (orchestrationResponse) => {
        console.log('✅ Agent orchestration completed');
        const agentData = orchestrationResponse.data;
        
        // Save planner output and create tasks
        if (agentData.plannerOutput) {
          const plannerOutput = new AgentOutput({
            projectId: project._id,
            agentName: 'planner',
            outputJSON: agentData.plannerOutput
          });
          await plannerOutput.save();
          
          // Extract tasks from phases
          const phases = agentData.plannerOutput.phases || [];
          const allTasks = [];
          
          for (const phase of phases) {
            const phaseTasks = phase.tasks || [];
            for (const taskData of phaseTasks) {
              allTasks.push({
                ...taskData,
                phase: phase.name
              });
            }
          }

          // Also handle flat tasks array (backward compatible)
          const flatTasks = agentData.plannerOutput.tasks || [];
          for (const taskData of flatTasks) {
            if (!allTasks.find(t => t.title === taskData.title)) {
              allTasks.push(taskData);
            }
          }

          // Get members with skills for assignment
          const fullProject = await Project.findById(project._id).populate('teamMembers.user', 'name email skills');
          const membersForAssignment = fullProject.teamMembers.map(m => ({
            userId: m.user._id,
            skills: m.user.skills || []
          }));

          // Assign tasks based on skills
          const assignedTasks = assignTasksToMembers(allTasks, membersForAssignment);

          for (const taskData of assignedTasks) {
            const task = new Task({
              projectId: project._id,
              title: taskData.title || taskData.name,
              description: taskData.description,
              phase: taskData.phase || '',
              priority: taskData.priority || 'medium',
              estimatedHours: taskData.estimatedHours || 0,
              requiredSkills: taskData.requiredSkills || [],
              assignedTo: taskData.assignedTo || null,
              status: 'todo'
            });
            await task.save();
          }
          console.log(`✅ Created ${assignedTasks.length} tasks from planner output`);
        }
        
        // Save research output
        if (agentData.researchOutput) {
          const researchOutput = new AgentOutput({
            projectId: project._id,
            agentName: 'research',
            outputJSON: agentData.researchOutput
          });
          await researchOutput.save();
        }
        
        // Save monitor output
        if (agentData.monitorOutput) {
          const monitorOutput = new AgentOutput({
            projectId: project._id,
            agentName: 'monitor',
            outputJSON: agentData.monitorOutput
          });
          await monitorOutput.save();
        }
        
        // Save documentation output
        if (agentData.documentationOutput) {
          const docOutput = new AgentOutput({
            projectId: project._id,
            agentName: 'documentation',
            outputJSON: agentData.documentationOutput
          });
          await docOutput.save();
        }
        
        // Update project status
        project.status = 'in-progress';
        await project.save();
        console.log('✅ All agent outputs saved');
      })
      .catch((error) => {
        console.error('❌ Agent orchestration error:', error.message);
      });

    // Return project immediately (agents run in background)
    res.status(201).json({
      project,
      message: 'Project created successfully. AI agents are processing in the background.'
    });
    
  } catch (error) {
    console.error('Create project with agents error:', error);
    res.status(500).json({ message: error.message });
  }
};
