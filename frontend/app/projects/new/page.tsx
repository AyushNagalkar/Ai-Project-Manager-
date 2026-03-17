'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    problemStatement: '',
    deadline: '',
    priority: 'medium',
    useAgents: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentStatus, setAgentStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAgentStatus('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        router.push('/auth/login');
        return;
      }

      const endpoint = formData.useAgents 
        ? 'http://localhost:5000/api/projects/with-agents' 
        : 'http://localhost:5000/api/projects';

      if (formData.useAgents) {
        setAgentStatus('Creating project and initializing AI agents...');
        // Notify sidebar
        window.dispatchEvent(new CustomEvent('agent-start', { detail: { agentName: 'planner' } }));
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project');
      }

      // Notify sidebar agent done
      window.dispatchEvent(new CustomEvent('agent-end'));

      router.push(`/projects/${data.project?._id || data._id}`);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project.');
      window.dispatchEvent(new CustomEvent('agent-end'));
    } finally {
      setLoading(false);
      setAgentStatus('');
    }
  };

  return (
    <div className="min-h-screen page-bg p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-blue-500 hover:text-blue-400 mb-6 flex items-center gap-2 text-sm"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-heading">Create New Project</h1>
          <p className="text-sub mt-2">Start a new project with AI-powered assistance</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-heading mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-heading mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your project..."
            />
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-heading mb-2">
              Project Domain {formData.useAgents && '*'}
            </label>
            <input
              type="text"
              id="domain"
              required={formData.useAgents}
              className="input-field"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="e.g., Machine Learning, Web Development, Data Science"
            />
          </div>

          <div>
            <label htmlFor="problemStatement" className="block text-sm font-medium text-heading mb-2">
              Problem Statement {formData.useAgents && '*'}
            </label>
            <textarea
              id="problemStatement"
              required={formData.useAgents}
              rows={3}
              className="input-field"
              value={formData.problemStatement}
              onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
              placeholder="What specific problem are you trying to solve?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-heading mb-2">
                Deadline
              </label>
              <input
                type="date"
                id="deadline"
                className="input-field"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-heading mb-2">
                Priority
              </label>
              <select
                id="priority"
                className="input-field"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* AI Agents Toggle */}
          <div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="useAgents"
                checked={formData.useAgents}
                onChange={(e) => setFormData({ ...formData, useAgents: e.target.checked })}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="useAgents" className="ml-3">
                <span className="block text-sm font-semibold text-heading">
                  🤖 Enable AI Agent Assistance
                </span>
                <span className="block text-sm text-sub mt-1">
                  AI agents will automatically generate tasks, research resources, analyze progress, and create documentation.
                </span>
              </label>
            </div>
          </div>

          {/* Agent Status Indicator */}
          {agentStatus && (
            <div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center text-blue-700 dark:text-blue-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                <span className="text-sm font-medium">{agentStatus}</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </span>
              ) : (
                'Create Project'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-secondary px-6 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
