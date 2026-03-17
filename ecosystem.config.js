module.exports = {
    apps: [
      {
        name: 'backend',
        cwd: './backend-node',
        script: 'src/server.js',
        env: {
          NODE_ENV: 'development',
        },
      },
      {
        name: 'orchestrator',
        cwd: './orchestrator',
        script: 'main.py',
        interpreter: 'python',
      },
      {
        name: 'planner-agent',
        cwd: './agents/planner',
        script: 'main.py',
        interpreter: 'python',
      },
      {
        name: 'research-agent',
        cwd: './agents/research',
        script: 'main.py',
        interpreter: 'python',
      },
      {
        name: 'monitor-agent',
        cwd: './agents/monitor',
        script: 'main.py',
        interpreter: 'python',
      },
      {
        name: 'documentation-agent',
        cwd: './agents/documentation',
        script: 'main.py',
        interpreter: 'python',
      },
    ],
  };
