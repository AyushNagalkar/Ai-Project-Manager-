# SmartPM — Code Patterns & Conventions

## Backend (Node.js)

### Auth Pattern
All protected routes use `middleware/auth.js` which verifies JWT and attaches `req.user = { id, email }`.

### Controller Pattern
- Controllers import models directly
- Project membership checked via `project.isMember(userId)` and `project.isLeader(userId)` instance methods
- Agent calls use axios to Python services; timeout 120s for LLM calls

### Task Assignment Logic (projectController.js)
When Planner output creates tasks:
1. For each task, collect `requiredSkills`
2. Score each team member: count of matching skills (case-insensitive substring)
3. Assign task to highest-scoring member
4. Tie-break: first member with highest score

## Python Agents

### dotenv Loading
All agents: `load_dotenv(dotenv_path='../../.env')`
Orchestrator: `load_dotenv(dotenv_path='../.env')`
→ Must be started from within their directory, NOT from project root

### LLM Response Parsing
All agents use `parse_llm_json(content)`:
1. Try to extract from ```json ... ``` code block
2. Find first `{` to last `}` as fallback
3. `json.loads(content)`
4. Each agent has a hardcoded fallback dict if parsing fails

### Pydantic v2 Models
All agents use Pydantic v2. Response models have `Optional` fields with defaults. FastAPI validates automatically.

## Frontend (Next.js)

### API Client
`frontend/lib/api.ts` — Axios instance auto-attaches `Authorization: Bearer <token>` from localStorage.
Exports: `authAPI`, `projectsAPI`, `tasksAPI`, `membersAPI`, `agentsAPI`

### Known Bad Pattern (to fix)
Several pages bypass `lib/api.ts` and hardcode `http://localhost:5000/api/...` directly:
- `app/projects/new/page.tsx`
- `app/projects/[id]/page.tsx`
- `app/projects/page.tsx`

### Agent Sidebar
`AgentSidebar.tsx` polls `GET http://localhost:8000/health` every 15s.
Listens for DOM events `agent-start` and `agent-end` to show animated active state.

## MongoDB Patterns

### Primary Keys
All collections use MongoDB `_id` (ObjectId) as primary key.

### Foreign Keys
- `tasks.projectId` → `projects._id`
- `tasks.assignedTo` → `users._id`
- `agentoutputs.projectId` → `projects._id`
- `documents.projectId` → `projects._id`
- `progresslogs.projectId` → `projects._id`

### Compound Indexes
- tasks: `(projectId, status)`, `(assignedTo, status)`, `(projectId, phase)`
- documents: `(projectId, type)`, `(projectId, createdAt desc)`
