'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface AgentStatus {
  name: string;
  healthy: boolean;
}

const AGENTS = [
  {
    key: 'planner',
    label: 'Planner Agent',
    model: 'Step 3.5 Flash',
    icon: '🎯',
    description: 'Phase planning & task breakdown',
    color: '#3B82F6',
    colorLight: 'rgba(59,130,246,0.12)',
    port: 8001,
  },
  {
    key: 'research',
    label: 'Research Agent',
    model: 'Step 3.5 Flash',
    icon: '🔬',
    description: 'Papers, datasets & tools',
    color: '#A855F7',
    colorLight: 'rgba(168,85,247,0.12)',
    port: 8002,
  },
  {
    key: 'monitor',
    label: 'Monitor Agent',
    model: 'Step 3.5 Flash',
    icon: '📊',
    description: 'Progress & risk tracking',
    color: '#22C55E',
    colorLight: 'rgba(34,197,94,0.12)',
    port: 8003,
  },
  {
    key: 'documentation',
    label: 'Documentation Agent',
    model: 'Step 3.5 Flash',
    icon: '📝',
    description: 'Multi-format doc generation',
    color: '#F97316',
    colorLight: 'rgba(249,115,22,0.12)',
    port: 8004,
  },
  {
    key: 'resume-parser',
    label: 'Resume Parser',
    model: 'PyMuPDF OCR',
    icon: '📄',
    description: 'PDF resume extraction',
    color: '#EC4899',
    colorLight: 'rgba(236,72,153,0.12)',
    port: 8005,
  },
];

const MIN_WIDTH = 68;
const MAX_WIDTH = 420;
const COLLAPSED_THRESHOLD = 120;
const DEFAULT_WIDTH = 260;

export default function AgentSidebar() {
  const pathname = usePathname();
  const [agentHealth, setAgentHealth] = useState<Record<string, string>>({});
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_WIDTH);

  const collapsed = sidebarWidth < COLLAPSED_THRESHOLD;

  // Keep main content margin in sync with sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }, [sidebarWidth]);

  const isAuthPage = pathname?.startsWith('/auth') || pathname === '/';

  // Poll agent health every 15 seconds
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          setAgentHealth(data.agents || {});
        }
      } catch {
        setAgentHealth({});
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Agent active/idle events
  useEffect(() => {
    const handleStart = (e: CustomEvent) => setActiveAgent(e.detail.agentName);
    const handleEnd = () => setActiveAgent(null);

    window.addEventListener('agent-start' as any, handleStart);
    window.addEventListener('agent-end' as any, handleEnd);
    return () => {
      window.removeEventListener('agent-start' as any, handleStart);
      window.removeEventListener('agent-end' as any, handleEnd);
    };
  }, []);

  // Drag-to-resize handlers
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStartX.current;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
    setSidebarWidth(next);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth, onMouseMove, onMouseUp]);

  // Snap: double-click the handle to toggle between default and collapsed
  const onDragHandleDoubleClick = useCallback(() => {
    setSidebarWidth(w => w < COLLAPSED_THRESHOLD ? DEFAULT_WIDTH : MIN_WIDTH);
  }, []);

  useEffect(() => {
    if (isAuthPage) {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    }
  }, [isAuthPage]);

  if (isAuthPage) {
    return null;
  }

  return (
    <aside
      style={{
        width: sidebarWidth,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 40,
        transition: isDragging.current ? 'none' : 'width 0.2s ease',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="text-white font-bold text-lg tracking-tight truncate">SmartPM</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
        )}
      </div>

      {/* Section Label */}
      {!collapsed && (
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">
            AI Models
          </p>
        </div>
      )}

      {/* Agent Cards */}
      <div
        className="px-3 py-2 space-y-2 overflow-y-auto custom-scrollbar"
        style={{ maxHeight: 'calc(100vh - 130px)' }}
      >
        {AGENTS.map((agent) => {
          const health = agentHealth[agent.key] || 'unknown';
          const isActive = activeAgent === agent.key;
          const isOnline = health === 'healthy';

          return (
            <div
              key={agent.key}
              className="agent-card relative rounded-xl cursor-default"
              style={{
                padding: collapsed ? '8px' : '12px',
                display: collapsed ? 'flex' : 'block',
                alignItems: collapsed ? 'center' : undefined,
                justifyContent: collapsed ? 'center' : undefined,
                background: isActive ? agent.colorLight : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isActive ? agent.color + '90' : 'transparent'}`,
                boxShadow: isActive ? `0 0 10px ${agent.color}25` : 'none',
              }}
            >
              {/* Subtle active overlay — no harsh border flash */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    animation: 'breathing-glow 3s ease-in-out infinite',
                    border: `1.5px solid ${agent.color}70`,
                  }}
                />
              )}

              {collapsed ? (
                <div className="relative">
                  <span className="text-2xl">{agent.icon}</span>
                  <div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-800"
                    style={{
                      background: isActive ? agent.color : isOnline ? '#22C55E' : '#EF4444',
                      animation: isActive ? 'status-pulse 3s ease-in-out infinite' : 'none',
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ background: agent.colorLight }}
                    >
                      {agent.icon}
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800"
                      style={{
                        background: isActive ? agent.color : isOnline ? '#22C55E' : '#EF4444',
                        animation: isActive ? 'status-pulse 3s ease-in-out infinite' : 'none',
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-white text-sm font-semibold truncate">{agent.label}</h4>
                      {isActive && (
                        <span
                          className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ background: agent.color + 'cc', color: '#fff' }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5 truncate">{agent.model}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5 truncate">{agent.description}</p>

                    {/* Status bar */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div
                        className="h-1 flex-1 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: isOnline || isActive ? '100%' : '0%',
                            background: isActive
                              ? `linear-gradient(90deg, ${agent.color}, ${agent.color}80)`
                              : isOnline
                                ? 'rgba(34,197,94,0.5)'
                                : 'rgba(239,68,68,0.5)',
                            animation: isActive ? 'status-bar-pulse 3s ease-in-out infinite' : 'none',
                            transition: 'width 0.8s ease',
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 flex-shrink-0">
                        {isActive ? 'Running' : isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Orchestrator Status */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-slate-700/50">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-1'}`}>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: Object.keys(agentHealth).length > 0 ? '#4ade80' : '#f87171',
              boxShadow: Object.keys(agentHealth).length > 0
                ? '0 0 6px rgba(74,222,128,0.5)'
                : '0 0 6px rgba(248,113,113,0.5)',
            }}
          />
          {!collapsed && (
            <span className="text-[11px] text-slate-500 truncate">
              Orchestrator {Object.keys(agentHealth).length > 0 ? 'Connected' : 'Offline'}
            </span>
          )}
        </div>
      </div>

      {/* Drag handle — right edge */}
      <div
        onMouseDown={onDragHandleMouseDown}
        onDoubleClick={onDragHandleDoubleClick}
        title="Drag to resize · Double-click to collapse"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 5,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 50,
          background: 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.35)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />
    </aside>
  );
}
