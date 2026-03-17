'use client';

import { useState, useEffect } from 'react';

interface AgentStatusBadgeProps {
  agentName: string;
  status: 'running' | 'idle' | 'error' | 'success';
  lastRun?: string;
}

export function AgentStatusBadge({ agentName, status, lastRun }: AgentStatusBadgeProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(status === 'running');
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400 dark:bg-gray-600';
    }
  };

  const getIcon = () => {
    switch (agentName.toLowerCase()) {
      case 'planner': return '🎯';
      case 'research': return '🔬';
      case 'monitor': return '📊';
      case 'documentation': return '📝';
      default: return '🤖';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        {pulse && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor()} animate-ping opacity-75`} />
        )}
      </div>
      <span className="text-sm font-medium text-heading">{getIcon()} {agentName}</span>
      {status === 'running' && (
        <span className="text-xs text-dim animate-pulse">Running...</span>
      )}
      {lastRun && status !== 'running' && (
        <span className="text-xs text-dim">{lastRun}</span>
      )}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`} />
      {message && <p className="text-sm text-sub">{message}</p>}
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export function ProgressBar({ progress, label, showPercentage = true, color = 'blue' }: ProgressBarProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-sub">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-heading">{progress}%</span>
          )}
        </div>
      )}
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

interface AgentActivityCardProps {
  agentName: string;
  activity: string;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
  details?: string;
}

export function AgentActivityCard({ agentName, activity, timestamp, status, details }: AgentActivityCardProps) {
  const getIcon = () => {
    switch (agentName.toLowerCase()) {
      case 'planner': return '🎯';
      case 'research': return '🔬';
      case 'monitor': return '📊';
      case 'documentation': return '📝';
      default: return '🤖';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
            ✓ Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
            ✗ Failed
          </span>
        );
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getIcon()}</span>
          <div>
            <h4 className="font-semibold text-heading">{agentName}</h4>
            <p className="text-sm text-sub">{activity}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>
      {details && (
        <p className="text-sm text-sub mt-2 pl-10">{details}</p>
      )}
      <p className="text-xs text-dim mt-2 pl-10">{timestamp}</p>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-sub mb-1">{title}</h3>
      <p className="text-3xl font-bold text-heading">{value}</p>
    </div>
  );
}

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
}

export function ToastNotification({ message, type, onClose }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
    error: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
    info: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
  };

  const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${typeStyles[type]} border rounded-lg p-4 shadow-lg animate-slide-in`}>
      <span className="text-xl">{icons[type]}</span>
      <span className="font-medium">{message}</span>
      {onClose && (
        <button
          onClick={() => { setIsVisible(false); onClose(); }}
          className="ml-4 text-dim hover:text-heading"
        >
          ×
        </button>
      )}
    </div>
  );
}
