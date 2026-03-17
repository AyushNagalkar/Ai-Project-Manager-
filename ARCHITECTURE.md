# SmartPM Architecture Documentation

## System Overview

SmartPM is a multi-layered agentic AI system with 5 main layers:

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│                   (Browser / Mobile)                     │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  FRONTEND LAYER                          │
│              Next.js 14 + React + Tailwind              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  Dashboard   │ │  Task Board  │ │ Agent Panel  │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│                  BACKEND API LAYER                       │
│              Node.js + Express + JWT Auth               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │   Auth API   │ │ Project API  │ │  Task API    │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Agent Gateway Controller               │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP Requests
┌───────────────────────▼─────────────────────────────────┐
│              AGENT ORCHESTRATION LAYER                   │
│              FastAPI + LangChain                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │     Agent Orchestrator (Port 8000)               │   │
│  │  - Coordinates agent execution                   │   │
│  │  - Manages pipeline flow                         │   │
│  │  - Handles agent communication                   │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ Agent Calls
┌───────────────────────▼─────────────────────────────────┐
│                   AGENT LAYER                            │
│              FastAPI Microservices + LangChain          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │   Planner    │ │   Research   │ │   Monitor    │   │
│  │   Agent      │ │    Agent     │ │    Agent     │   │
│  │  (Port 8001) │ │  (Port 8002) │ │  (Port 8003) │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│  ┌──────────────┐                                        │
│  │Documentation │                                        │
│  │    Agent     │                                        │
│  │  (Port 8004) │                                        │
│  └──────────────┘                                        │
└───────────────────────┬─────────────────────────────────┘
                        │ Data Storage
┌───────────────────────▼─────────────────────────────────┐
│                  DATABASE LAYER                          │
│                  MongoDB Atlas                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │    Users     │ │   Projects   │ │    Tasks     │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │AgentOutputs  │ │ProgressLogs  │ │  Documents   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Agent Pipeline Flow

```
Project Created
      │
      ▼
┌──────────────────┐
│  Planner Agent   │ ──► Generates milestones and tasks
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Research Agent  │ ──► Collects papers, datasets, tools
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Monitor Agent   │ ──► Analyzes progress and risks
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Documentation     │ ──► Generates reports and presentations
│     Agent        │
└──────────────────┘
         │
         ▼
    Results Stored
  in MongoDB Atlas
```

## Agent Communication Protocol

All agents communicate via JSON:

### Planner Agent Input/Output
**Input:**
```json
{
  "projectTitle": "string",
  "domain": "string",
  "problemStatement": "string",
  "teamMembers": ["string"]
}
```

**Output:**
```json
{
  "milestones": [
    {
      "name": "string",
      "description": "string",
      "duration": "string",
      "deliverables": ["string"]
    }
  ],
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "milestone": "string",
      "priority": "high|medium|low",
      "estimatedHours": 0,
      "dependencies": []
    }
  ],
  "timeline": {},
  "recommendations": ["string"]
}
```

### Research Agent Input/Output
**Input:**
```json
{
  "domain": "string",
  "keywords": ["string"]
}
```

**Output:**
```json
{
  "papers": [{
    "title": "string",
    "authors": ["string"],
    "year": 0,
    "abstract": "string",
    "relevance": "string"
  }],
  "datasets": [{
    "name": "string",
    "description": "string",
    "source": "string",
    "format": "string"
  }],
  "tools": [{
    "name": "string",
    "description": "string",
    "category": "string",
    "installation": "string"
  }],
  "summary": "string",
  "recommendations": ["string"]
}
```

### Monitor Agent Input/Output
**Input:**
```json
{
  "tasks": [{
    "title": "string",
    "status": "string",
    "deadline": "date"
  }],
  "progressLogs": [{
    "completionPercentage": 0,
    "updatedAt": "date"
  }]
}
```

**Output:**
```json
{
  "progress": 0,
  "riskLevel": "low|medium|high|critical",
  "risks": [{
    "level": "string",
    "description": "string",
    "mitigation": "string",
    "impact": "string"
  }],
  "delays": [{
    "taskTitle": "string",
    "expectedDate": "date",
    "reason": "string",
    "recommendation": "string"
  }],
  "insights": ["string"],
  "recommendations": ["string"]
}
```

### Documentation Agent Input/Output
**Input:**
```json
{
  "project": {
    "title": "string",
    "domain": "string",
    "problemStatement": "string"
  },
  "tasks": [{}],
  "research": {}
}
```

**Output:**
```json
{
  "report": "string",
  "pptOutline": [{
    "slideNumber": 0,
    "title": "string",
    "content": ["string"],
    "notes": "string"
  }],
  "vivaQuestions": [{
    "question": "string",
    "suggestedAnswer": "string",
    "category": "string"
  }],
  "abstract": "string",
  "conclusion": "string"
}
```

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Forms:** React Hook Form

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator

### Agents
- **Framework:** FastAPI
- **AI Orchestration:** LangChain
- **LLM Provider:** OpenAI GPT-4
- **HTTP Client:** Requests

### Database
- **Database:** MongoDB Atlas
- **ODM:** Mongoose

## Security

### Authentication
- JWT-based authentication
- Token stored in localStorage
- Authorization middleware on protected routes
- Password hashing with bcrypt

### API Security
- CORS enabled
- Request validation
- Error handling middleware
- Rate limiting (recommended for production)

## Deployment Considerations

### Development
- Run all services locally
- Use `start-all.ps1` script
- Monitor logs in separate terminals

### Production
- Deploy backend on Cloud Run / EC2
- Deploy agents on separate containers
- Deploy frontend on Vercel / Netlify
- Use environment-specific .env files
- Enable HTTPS
- Add rate limiting
- Set up monitoring (Sentry, DataDog)

## Scaling Strategy

### Horizontal Scaling
- Add more agent instances
- Load balance agent requests
- Use Redis for caching

### Vertical Scaling
- Increase agent instance size
- Optimize LLM token usage
- Add caching layer

## Monitoring & Observability

### Metrics to Track
- Agent response times
- API endpoint latency
- Database query performance
- LLM token usage
- Error rates

### Logging
- Structured logging with Winston/Pino
- Centralized log aggregation
- Error tracking with Sentry

## Cost Optimization

### LLM Usage
- Cache common agent responses
- Use smaller models for simple tasks
- Implement rate limiting
- Monitor token consumption

### Infrastructure
- Use serverless for infrequent tasks
- Optimize database queries
- Implement CDN for frontend
- Use connection pooling

---

**Version:** 1.0.0  
**Last Updated:** February 2026
