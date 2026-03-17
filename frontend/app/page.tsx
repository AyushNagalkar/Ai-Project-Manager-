'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      router.push('/dashboard')
    }
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 dark:bg-[#0f172a] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium">
          <span className="animate-pulse">🤖</span> Powered by 4 AI Agents
        </div>
        <h1 className="text-6xl font-bold text-heading mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SmartPM
        </h1>
        <p className="text-2xl text-sub mb-4">
          AI-Powered Project Management
        </p>
        <p className="text-lg text-dim mb-12 max-w-2xl">
          Leverage the power of AI agents to plan, research, monitor, and document your projects automatically.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary px-8 py-3 text-lg"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/auth/register')}
            className="btn-secondary px-8 py-3 text-lg"
          >
            Register
          </button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl">
          {[
            { icon: '🎯', name: 'Planner Agent', desc: 'Phase planning & task breakdown', color: 'blue' },
            { icon: '🔬', name: 'Research Agent', desc: 'Papers, datasets & tools', color: 'purple' },
            { icon: '📊', name: 'Monitor Agent', desc: 'Progress & risk tracking', color: 'green' },
            { icon: '📝', name: 'Doc Agent', desc: 'Reports & presentations', color: 'orange' },
          ].map((agent) => (
            <div key={agent.name} className="card text-center group hover:scale-[1.03] transition-transform">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{agent.icon}</div>
              <h3 className="font-bold text-lg mb-2 text-heading">{agent.name}</h3>
              <p className="text-sm text-sub">{agent.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
