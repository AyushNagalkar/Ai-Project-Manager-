'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { projectsAPI } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agentHealth, setAgentHealth] = useState<Record<string, string>>({})

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token) {
      router.push('/auth/login')
      return
    }

    if (userStr) {
      try { setUser(JSON.parse(userStr)) } catch {}
    }

    loadProjects()
    checkAgentHealth()
  }, [router])

  const checkAgentHealth = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const response = await fetch('http://localhost:8000/health', { signal: controller.signal })
      clearTimeout(timeoutId)
      const data = await response.json()
      if (data.agents) setAgentHealth(data.agents)
    } catch {
      setAgentHealth({})
    }
  }

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const healthyCount = Object.values(agentHealth).filter(s => s === 'healthy').length

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg">
      {/* Header */}
      <header className="card-bg border-b sticky top-0 z-30" style={{ borderRadius: 0 }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-heading">Dashboard</h1>
            <p className="text-dim text-sm">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/projects/new')}
              className="btn-primary"
            >
              + New Project
            </button>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Projects', value: projects.length, icon: '📁', color: 'blue' },
            { label: 'In Progress', value: projects.filter((p: any) => p.status === 'in-progress').length, icon: '🔄', color: 'yellow' },
            { label: 'Agents Online', value: `${healthyCount}/5`, icon: '🤖', color: 'green' },
            { label: 'Completed', value: projects.filter((p: any) => p.status === 'completed').length, icon: '✅', color: 'purple' },
          ].map((stat) => (
            <div key={stat.label} className="card group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-700 dark:text-${stat.color}-300`}>
                  {stat.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-heading">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Agent Health Bar */}
        <div className="card mb-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 text-white !border-none">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">🤖 AI Agent Status</h2>
              <p className="text-blue-100 text-sm">{healthyCount === 5 ? 'All systems operational' : `${healthyCount}/5 agents online`}</p>
            </div>
            <button onClick={checkAgentHealth} className="bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-lg text-sm font-medium">
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'planner', name: 'Planner', icon: '🎯' },
              { key: 'research', name: 'Research', icon: '🔬' },
              { key: 'monitor', name: 'Monitor', icon: '📊' },
              { key: 'documentation', name: 'Docs', icon: '📝' },
              { key: 'resume-parser', name: 'OCR', icon: '📄' },
            ].map((agent) => (
              <div key={agent.key} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">{agent.icon}</div>
                <p className="text-sm font-medium">{agent.name}</p>
                <div className={`mt-1 text-xs font-medium ${agentHealth[agent.key] === 'healthy' ? 'text-green-300' : 'text-red-300'}`}>
                  {agentHealth[agent.key] === 'healthy' ? '● Online' : '○ Offline'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-heading mb-4">Your Projects</h2>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-heading mb-2">No projects yet</h3>
            <p className="text-sub mb-6">Create your first AI-powered project to get started</p>
            <button onClick={() => router.push('/projects/new')} className="btn-primary px-8 py-3">
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project: any) => (
              <div
                key={project._id}
                className="card cursor-pointer group hover:scale-[1.02] transition-transform"
                onClick={() => router.push(`/projects/${project._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-heading group-hover:text-blue-500 transition-colors">
                    {project.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    project.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    project.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sub text-sm mb-3 line-clamp-2">{project.description}</p>
                {project.domain && (
                  <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-3">
                    {project.domain}
                  </span>
                )}
                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-dim text-xs">
                    {project.teamMembers?.length || 0} members
                  </span>
                  <span className="text-dim text-xs">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
