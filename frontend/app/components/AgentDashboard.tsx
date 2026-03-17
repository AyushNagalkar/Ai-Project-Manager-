'use client';

import { useState } from 'react';

interface AgentOutput {
  _id: string;
  agentName: string;
  outputJSON: any;
  createdAt: string;
}

interface AgentDashboardProps {
  projectId: string;
  agentOutputs: AgentOutput[];
  onTriggerAgent: (agentName: string, docType?: string) => void;
  loading: boolean;
}

export default function AgentDashboard({ projectId, agentOutputs, onTriggerAgent, loading }: AgentDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [docType, setDocType] = useState<string>('all');

  const agents = [
    { name: 'planner', icon: '🎯', title: 'Planner Agent', description: 'Generates milestones and task breakdowns', color: 'blue' },
    { name: 'research', icon: '🔬', title: 'Research Agent', description: 'Finds papers, datasets, and tools', color: 'purple' },
    { name: 'monitor', icon: '📊', title: 'Monitor Agent', description: 'Tracks progress and identifies risks', color: 'green' },
    { name: 'documentation', icon: '📝', title: 'Documentation Agent', description: 'Generates reports and presentations', color: 'orange' },
  ];

  const getAgentOutput = (agentName: string) => {
    return agentOutputs.find(output => output.agentName === agentName);
  };

  const renderPlannerOutput = (output: any) => {
    if (!output) return null;
    return (
      <div className="space-y-6">
        {output.milestones && output.milestones.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">📍 Milestones</h4>
            <div className="grid gap-4">
              {output.milestones.map((milestone: any, idx: number) => (
                <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-blue-900 dark:text-blue-200">{milestone.name}</h5>
                    <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">{milestone.duration}</span>
                  </div>
                  <p className="text-sm text-sub mb-2">{milestone.description}</p>
                  {milestone.deliverables && milestone.deliverables.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-dim mb-1">Deliverables:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {milestone.deliverables.map((del: string, i: number) => (
                          <li key={i} className="text-sub">{del}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {output.tasks && output.tasks.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">✅ Tasks ({output.tasks.length})</h4>
            <div className="grid gap-3">
              {output.tasks.slice(0, 10).map((task: any, idx: number) => (
                <div key={idx} className="card p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-heading">{task.title}</h5>
                      <p className="text-sm text-sub mt-1">{task.description}</p>
                      {task.milestone && (<p className="text-xs text-blue-500 mt-1">📍 {task.milestone}</p>)}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>{task.priority}</span>
                      {task.estimatedHours && (<span className="text-xs text-dim">~{task.estimatedHours}h</span>)}
                    </div>
                  </div>
                </div>
              ))}
              {output.tasks.length > 10 && (
                <p className="text-sm text-dim text-center">+ {output.tasks.length - 10} more tasks</p>
              )}
            </div>
          </div>
        )}

        {output.recommendations && output.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">💡 Recommendations</h4>
            <ul className="space-y-2">
              {output.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-sub">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderResearchOutput = (output: any) => {
    if (!output) return null;
    return (
      <div className="space-y-6">
        {output.summary && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">📋 Research Summary</h4>
            <p className="text-sub">{output.summary}</p>
          </div>
        )}

        {output.papers && output.papers.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">📚 Research Papers ({output.papers.length})</h4>
            <div className="space-y-3">
              {output.papers.slice(0, 5).map((paper: any, idx: number) => (
                <div key={idx} className="card p-4">
                  <h5 className="font-medium text-heading mb-1">{paper.title}</h5>
                  <p className="text-sm text-sub mb-2">{paper.authors?.join(', ')} • {paper.year}</p>
                  <p className="text-sm text-sub mb-2">{paper.abstract}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">{paper.relevance}</p>
                  {paper.url && (
                    <a href={paper.url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-500 hover:underline mt-2 inline-block">
                      View Paper →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {output.datasets && output.datasets.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">💾 Datasets ({output.datasets.length})</h4>
            <div className="grid gap-3">
              {output.datasets.map((dataset: any, idx: number) => (
                <div key={idx} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <h5 className="font-medium text-purple-900 dark:text-purple-200">{dataset.name}</h5>
                  <p className="text-sm text-sub mt-1">{dataset.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-dim">
                    <span>📦 {dataset.format}</span>
                    <span>🔗 {dataset.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {output.tools && output.tools.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">🛠️ Recommended Tools ({output.tools.length})</h4>
            <div className="grid md:grid-cols-2 gap-3">
              {output.tools.map((tool: any, idx: number) => (
                <div key={idx} className="card p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-heading">{tool.name}</h5>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">{tool.category}</span>
                  </div>
                  <p className="text-sm text-sub mb-2">{tool.description}</p>
                  {tool.installation && (
                    <code className="text-xs px-2 py-1 rounded block" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {tool.installation}
                    </code>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonitorOutput = (output: any) => {
    if (!output) return null;
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h4 className="text-sm text-dim mb-2">Progress</h4>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">{output.progress || 0}%</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--border)' }}>
                <div className="h-full bg-green-500 transition-all" style={{ width: `${output.progress || 0}%` }} />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <h4 className="text-sm text-dim mb-2">Risk Level</h4>
            <span className={`text-2xl font-bold ${
              output.riskLevel === 'critical' ? 'text-red-600' :
              output.riskLevel === 'high' ? 'text-orange-600' :
              output.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>{output.riskLevel?.toUpperCase() || 'LOW'}</span>
          </div>
          <div className="card p-4">
            <h4 className="text-sm text-dim mb-2">Status</h4>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{output.delays?.length || 0} Delays</span>
          </div>
        </div>

        {output.risks && output.risks.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">⚠️ Identified Risks</h4>
            <div className="space-y-3">
              {output.risks.map((risk: any, idx: number) => (
                <div key={idx} className={`border rounded-lg p-4 ${
                  risk.level === 'critical' || risk.level === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : risk.level === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-heading">{risk.description}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${
                      risk.level === 'critical' || risk.level === 'high'
                        ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                        : risk.level === 'medium'
                        ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                        : 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    }`}>{risk.level}</span>
                  </div>
                  <p className="text-sm text-sub mb-2"><strong>Impact:</strong> {risk.impact}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400"><strong>Mitigation:</strong> {risk.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {output.delays && output.delays.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">⏰ Delays Detected</h4>
            <div className="space-y-2">
              {output.delays.map((delay: any, idx: number) => (
                <div key={idx} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-orange-900 dark:text-orange-200">{delay.taskTitle}</h5>
                    <span className="text-xs text-orange-700 dark:text-orange-300">{delay.expectedDate}</span>
                  </div>
                  <p className="text-sm text-sub mb-1">{delay.reason}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">💡 {delay.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {output.insights && output.insights.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">💡 Insights</h4>
            <ul className="space-y-2">
              {output.insights.map((insight: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                  <span className="text-blue-500">•</span>
                  <span className="text-sub">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {output.recommendations && output.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">📌 Recommendations</h4>
            <ul className="space-y-2">
              {output.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sub">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderDocumentationOutput = (output: any) => {
    if (!output) return null;
    return (
      <div className="space-y-6">
        {output.abstract && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">📄 Abstract</h4>
            <p className="text-sub text-sm leading-relaxed">{output.abstract}</p>
          </div>
        )}

        {output.pptOutline && output.pptOutline.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">🎯 Presentation Outline ({output.pptOutline.length} slides)</h4>
            <div className="space-y-2">
              {output.pptOutline.map((slide: any, idx: number) => (
                <div key={idx} className="card p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded flex items-center justify-center text-sm font-bold">
                      {slide.slideNumber}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-heading mb-1">{slide.title}</h5>
                      {slide.content && slide.content.length > 0 && (
                        <ul className="text-sm text-sub space-y-1">
                          {slide.content.map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2"><span>•</span><span>{point}</span></li>
                          ))}
                        </ul>
                      )}
                      {slide.notes && (<p className="text-xs text-dim mt-2 italic">Notes: {slide.notes}</p>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {output.vivaQuestions && output.vivaQuestions.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">❓ Viva Questions ({output.vivaQuestions.length})</h4>
            <div className="space-y-3">
              {output.vivaQuestions.map((viva: any, idx: number) => (
                <div key={idx} className="card p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    <h5 className="font-medium text-heading flex-1">{viva.question}</h5>
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{viva.category}</span>
                  </div>
                  <div className="ml-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 mt-2">
                    <p className="text-sm text-sub">
                      <strong className="text-green-700 dark:text-green-400">Answer:</strong> {viva.suggestedAnswer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {output.report && (
          <div>
            <h4 className="font-semibold text-lg mb-3 text-heading">📝 Project Report</h4>
            <div className="card p-4">
              <pre className="whitespace-pre-wrap text-sm text-sub font-sans">{output.report}</pre>
            </div>
          </div>
        )}

        {output.conclusion && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">🎓 Conclusion</h4>
            <p className="text-sub text-sm leading-relaxed">{output.conclusion}</p>
          </div>
        )}
      </div>
    );
  };

  const renderAgentOutput = (agentName: string) => {
    const output = getAgentOutput(agentName);
    
    if (!output) {
      return (
        <div className="text-center py-12">
          <div className="text-dim text-6xl mb-4">🤖</div>
          <p className="text-sub mb-4">No output yet from this agent</p>
          
          {agentName === 'documentation' && (
            <div className="flex justify-center items-center gap-3 mb-4">
              <label className="text-sm font-medium text-heading">Format:</label>
              <select 
                value={docType} 
                onChange={(e) => setDocType(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-heading outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Formats</option>
                <option value="report">Project Report</option>
                <option value="ppt_content">PPT Content</option>
                <option value="viva_questions">Viva Questions</option>
                <option value="readme">README.md</option>
              </select>
            </div>
          )}

          <button onClick={() => onTriggerAgent(agentName, agentName === 'documentation' ? docType : undefined)} disabled={loading} className="btn-primary">
            {loading ? 'Running...' : `Run ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Agent`}
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-sm text-dim">Last updated: {new Date(output.createdAt).toLocaleString()}</div>
          <div className="flex items-center gap-3">
            {agentName === 'documentation' && (
              <select 
                value={docType} 
                onChange={(e) => setDocType(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-heading outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Generate All</option>
                <option value="report">New Report</option>
                <option value="ppt_content">New PPT</option>
                <option value="viva_questions">New Viva Qs</option>
                <option value="readme">New README</option>
              </select>
            )}
            <button onClick={() => onTriggerAgent(agentName, agentName === 'documentation' ? docType : undefined)} disabled={loading} className="btn-secondary text-sm">
              {loading ? 'Running...' : 'Generate Format'}
            </button>
          </div>
        </div>
        {agentName === 'planner' && renderPlannerOutput(output.outputJSON)}
        {agentName === 'research' && renderResearchOutput(output.outputJSON)}
        {agentName === 'monitor' && renderMonitorOutput(output.outputJSON)}
        {agentName === 'documentation' && renderDocumentationOutput(output.outputJSON)}
      </div>
    );
  };

  const agentColors: Record<string, string> = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
  };

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-heading mb-2">🤖 AI Agent Dashboard</h2>
        <p className="text-sub">View and manage AI agent outputs for your project</p>
      </div>

      {/* Agent Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedAgent('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            selectedAgent === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-sub hover:bg-blue-50 dark:hover:bg-slate-700'
          }`}
          style={selectedAgent !== 'all' ? { background: 'var(--bg-secondary)' } : {}}
        >
          All Agents
        </button>
        {agents.map((agent) => (
          <button
            key={agent.name}
            onClick={() => setSelectedAgent(agent.name)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              selectedAgent === agent.name
                ? `${agentColors[agent.color]} text-white`
                : 'text-sub hover:bg-blue-50 dark:hover:bg-slate-700'
            }`}
            style={selectedAgent !== agent.name ? { background: 'var(--bg-secondary)' } : {}}
          >
            <span>{agent.icon}</span>
            <span>{agent.title}</span>
          </button>
        ))}
      </div>

      {/* Agent Status Cards */}
      {selectedAgent === 'all' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {agents.map((agent) => {
            const output = getAgentOutput(agent.name);
            return (
              <div
                key={agent.name}
                onClick={() => setSelectedAgent(agent.name)}
                className="card cursor-pointer hover:scale-[1.02] transition-transform !p-4"
              >
                <div className="text-4xl mb-2">{agent.icon}</div>
                <h3 className="font-semibold text-heading mb-1">{agent.title}</h3>
                <p className="text-sm text-sub mb-3">{agent.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    output
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'text-dim'
                  }`} style={!output ? { background: 'var(--bg-secondary)' } : {}}>
                    {output ? '✓ Complete' : 'Not run'}
                  </span>
                  {output && (
                    <span className="text-xs text-dim">{new Date(output.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agent Output Display */}
      {selectedAgent !== 'all' && (
        <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)' }}>
          {renderAgentOutput(selectedAgent)}
        </div>
      )}

      {/* Run All Agents Button */}
      {selectedAgent === 'all' && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              agents.forEach(agent => {
                const output = getAgentOutput(agent.name);
                if (!output) onTriggerAgent(agent.name);
              });
            }}
            disabled={loading}
            className="btn-primary px-8 py-3 text-lg"
          >
            {loading ? '⚙️ Running Agents...' : '🚀 Run All Missing Agents'}
          </button>
        </div>
      )}
    </div>
  );
}
