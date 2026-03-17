const cron = require('node-cron');
const axios = require('axios');
const Project = require('./models/Project');
const Task = require('./models/Task');
const AgentOutput = require('./models/AgentOutput');
const ProgressLog = require('./models/ProgressLog');

/**
 * Monitor Scheduler
 * Runs every 5 hours for all active projects.
 * Calls the Monitor Agent to assess progress and stores results.
 */
function startMonitorScheduler() {
  // Run every 5 hours: at minute 0 of hours 0, 5, 10, 15, 20
  cron.schedule('0 */5 * * *', async () => {
    console.log('⏰ [Scheduler] Running 5-hour monitor assessment...');
    
    try {
      // Find all active projects
      const activeProjects = await Project.find({
        status: { $in: ['planning', 'in-progress'] },
        monitorScheduleEnabled: true
      }).populate('teamMembers.user', 'name email skills');

      console.log(`📊 [Scheduler] Found ${activeProjects.length} active projects to monitor`);

      for (const project of activeProjects) {
        try {
          console.log(`📊 [Scheduler] Monitoring project: ${project.name}`);
          
          const tasks = await Task.find({ projectId: project._id })
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

          const monitorUrl = process.env.MONITOR_SERVICE_URL || 'http://localhost:8003';
          const response = await axios.post(`${monitorUrl}/monitor`, {
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
          }, { timeout: 60000 });

          // Save agent output
          const agentOutput = new AgentOutput({
            projectId: project._id,
            agentName: 'monitor',
            outputJSON: response.data,
            metadata: { version: 'scheduled' }
          });
          await agentOutput.save();

          // Save progress log
          const progressLog = new ProgressLog({
            projectId: project._id,
            completionPercentage: response.data.progress || 0,
            risks: response.data.risks || [],
            delays: response.data.delays || [],
            notes: `Scheduled assessment. Risk level: ${response.data.riskLevel || 'unknown'}`
          });
          await progressLog.save();

          project.lastMonitorRun = new Date();
          await project.save();

          console.log(`✅ [Scheduler] Completed monitoring for: ${project.name} (${response.data.progress}% progress)`);
        } catch (projectError) {
          console.error(`❌ [Scheduler] Failed to monitor project ${project.name}:`, projectError.message);
        }
      }

      console.log('✅ [Scheduler] 5-hour monitor assessment complete');
    } catch (error) {
      console.error('❌ [Scheduler] Monitor scheduler error:', error.message);
    }
  });

  console.log('⏰ Monitor scheduler started — will run every 5 hours');
}

module.exports = { startMonitorScheduler };
