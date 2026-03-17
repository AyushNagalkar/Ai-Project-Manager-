'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tasksAPI, agentsAPI } from '@/lib/api';
import AgentDashboard from '@/app/components/AgentDashboard';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [agentOutputs, setAgentOutputs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({ title: '', description: '', priority: 'medium', status: 'todo', deadline: '' });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [error, setError] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'agents' | 'docs'>('tasks');

  useEffect(() => {
    if (params.id) {
      fetchProject();
      fetchTasks();
      fetchAgentOutputs();
      fetchDocuments();
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/auth/login'); return; }
      const response = await fetch(`http://localhost:5000/api/projects/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setProject(data);
      else setError(data.message || 'Failed to load project');
    } catch (error: any) {
      setError(error.message || 'Failed to load project');
    } finally { setLoading(false); }
  };

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getByProject(params.id as string);
      setTasks(response.data);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchAgentOutputs = async () => {
    try {
      const response = await agentsAPI.getOutputs(params.id as string);
      setAgentOutputs(response.data);
    } catch (error: any) {
      console.error('Error fetching agent outputs:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await agentsAPI.getDocuments(params.id as string);
      setDocuments(response.data);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
    }
  };

  // Mark task as done
  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksAPI.complete(taskId);
      await fetchTasks();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete task');
    }
  };

  // Reopen task
  const handleUncompleteTask = async (taskId: string) => {
    try {
      await tasksAPI.uncomplete(taskId);
      await fetchTasks();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reopen task');
    }
  };

  const handleTriggerAgent = async (agentName: string, docType?: string) => {
    setAgentLoading(true);
    // Notify sidebar that agent is active
    window.dispatchEvent(new CustomEvent('agent-start', { detail: { agentName } }));
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const endpoint = `http://localhost:5000/api/agents/${agentName}`;
      const payload: any = { projectId: params.id };
      if (docType) payload.docType = docType;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        await fetchAgentOutputs();
        await fetchTasks();
        await fetchDocuments();
        alert(`${agentName} agent completed successfully!`);
      } else {
        throw new Error(data.message || `${agentName} agent failed`);
      }
    } catch (error: any) {
      alert(`Failed to run ${agentName} agent: ${error.message}`);
    } finally {
      setAgentLoading(false);
      window.dispatchEvent(new CustomEvent('agent-end'));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);
    setTaskError('');
    try {
      await tasksAPI.create({ ...taskFormData, projectId: params.id });
      setTaskModalOpen(false);
      setTaskFormData({ title: '', description: '', priority: 'medium', status: 'todo', deadline: '' });
      await fetchTasks();
    } catch (error: any) {
      setTaskError(error.response?.data?.message || 'Failed to create task');
    } finally { setTaskLoading(false); }
  };

  // Group tasks by phase
  const tasksByPhase: Record<string, any[]> = {};
  tasks.forEach((task: any) => {
    const phase = task.phase || 'Unassigned';
    if (!tasksByPhase[phase]) tasksByPhase[phase] = [];
    tasksByPhase[phase].push(task);
  });

  // Stats
  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="text-center card p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-heading mb-2">{error || 'Project not found'}</h2>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-blue-500 hover:text-blue-400 mb-6 flex items-center gap-2 text-sm">
          ← Back to Dashboard
        </button>

        {/* Project Header */}
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-heading mb-2">{project.name}</h1>
              <p className="text-sub">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                project.priority === 'high' ? 'bg-red-100 text-red-700' :
                project.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>{project.priority} priority</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <div><p className="text-sm text-dim">Status</p><p className="font-semibold text-heading capitalize">{project.status}</p></div>
            {project.deadline && <div><p className="text-sm text-dim">Deadline</p><p className="font-semibold text-heading">{new Date(project.deadline).toLocaleDateString()}</p></div>}
            <div><p className="text-sm text-dim">Tasks</p><p className="font-semibold text-heading">{completedCount}/{totalCount} done</p></div>
            <div><p className="text-sm text-dim">Progress</p><p className="font-semibold text-heading">{progressPercent}%</p></div>
            <div><p className="text-sm text-dim">Team</p>
              <button onClick={() => router.push(`/projects/${params.id}/team`)} className="font-semibold text-blue-600 hover:underline">
                {project.teamMembers?.length || 0} members →
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                   style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 card-bg rounded-xl p-1">
          {[
            { key: 'tasks', label: '📋 Tasks', count: totalCount },
            { key: 'agents', label: '🤖 AI Agents', count: agentOutputs.length },
            { key: 'docs', label: '📄 Documents', count: documents.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition ${
                activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-sub hover:bg-blue-50 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-heading">Tasks by Phase</h2>
              <button onClick={() => setTaskModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                + Add Task
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-sub mb-4">No tasks yet. Run the Planner Agent to auto-generate tasks!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
                  <div key={phase}>
                    <h3 className="text-md font-bold text-heading mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {phase}
                      <span className="text-xs font-normal text-dim">
                        ({phaseTasks.filter((t: any) => t.status === 'completed').length}/{phaseTasks.length} done)
                      </span>
                    </h3>
                    <div className="space-y-2 pl-4">
                      {phaseTasks.map((task: any) => (
                        <div key={task._id} className={`border rounded-xl p-4 transition ${
                          task.status === 'completed' ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'hover:border-blue-300 dark:hover:border-blue-700'
                        }`} style={{ borderColor: task.status !== 'completed' ? 'var(--border)' : undefined }}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Complete/Uncomplete button */}
                              <button
                                onClick={() => task.status === 'completed' ? handleUncompleteTask(task._id) : handleCompleteTask(task._id)}
                                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                                  task.status === 'completed'
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-gray-300 hover:border-blue-500'
                                }`}
                              >
                                {task.status === 'completed' && '✓'}
                              </button>
                              <div>
                                <h4 className={`font-semibold ${task.status === 'completed' ? 'text-dim line-through' : 'text-heading'}`}>
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-sub text-sm mt-1">{task.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                  {task.assignedTo && (
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                                      👤 {task.assignedTo.name || 'Assigned'}
                                    </span>
                                  )}
                                  {task.estimatedHours > 0 && (
                                    <span className="text-gray-400">⏱ {task.estimatedHours}h</span>
                                  )}
                                  {task.deadline && (
                                    <span className="text-gray-400">📅 {new Date(task.deadline).toLocaleDateString()}</span>
                                  )}
                                  {task.completedBy && (
                                    <span className="text-green-600">✅ Completed by {task.completedBy.name}</span>
                                  )}
                                </div>
                                {task.requiredSkills?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.requiredSkills.map((skill: string, i: number) => (
                                      <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{skill}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>{task.priority}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <AgentDashboard
            projectId={params.id as string}
            agentOutputs={agentOutputs}
            onTriggerAgent={handleTriggerAgent}
            loading={agentLoading}
          />
        )}

        {/* Documents Tab */}
        {activeTab === 'docs' && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-heading mb-4">📄 Generated Documents</h2>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-sub">No documents yet. Run the Documentation Agent to generate them!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc: any) => (
                  <div key={doc._id} className="rounded-xl p-4 hover:shadow-md transition" style={{ border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-heading">{doc.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">
                            {doc.type?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-dim text-xs">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const content = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content, null, 2);
                          const blob = new Blob([content], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${doc.title?.replace(/\s+/g, '_') || 'document'}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                      >
                        ⬇ Download
                      </button>
                    </div>
                    {typeof doc.content === 'string' && (
                      <p className="text-sub text-sm mt-2 line-clamp-3">{doc.content.substring(0, 200)}...</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-heading mb-4">Create New Task</h3>
            {taskError && <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">{taskError}</div>}
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Title *</label>
                <input type="text" required className="input-field"
                  value={taskFormData.title} onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Description</label>
                <textarea rows={3} className="input-field"
                  value={taskFormData.description} onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Priority</label>
                  <select className="input-field"
                    value={taskFormData.priority} onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}>
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Deadline</label>
                  <input type="date" className="input-field"
                    value={taskFormData.deadline} onChange={(e) => setTaskFormData({ ...taskFormData, deadline: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="submit" disabled={taskLoading}
                  className="flex-1 btn-primary py-2">
                  {taskLoading ? 'Creating...' : 'Create Task'}
                </button>
                <button type="button" onClick={() => { setTaskModalOpen(false); setTaskError(''); }}
                  className="btn-secondary px-6 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
