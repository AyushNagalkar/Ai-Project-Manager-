# SmartPM Project Memory

## Project Identity
- **Name:** SmartPM — AI-Powered Project Management for Students
- **Root:** `h:/Project Manager/`
- **Version:** 2.0.0
- **Stack:** Next.js 14 + Node.js/Express + FastAPI (x6) + MongoDB Atlas + Google Gemini 2.5 Flash

## Service Ports
| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (Node.js) | 5000 |
| Orchestrator (FastAPI) | 8000 |
| Planner Agent | 8001 |
| Research Agent | 8002 |
| Monitor Agent | 8003 |
| Documentation Agent | 8004 |
| Resume Parser | 8005 |

## Key Files
- Backend entry: `backend-node/src/server.js`
- Scheduler (5-hr monitor cron): `backend-node/src/scheduler.js`
- Orchestrator: `orchestrator/main.py`
- Agents: `agents/{planner,research,monitor,documentation,resume-parser}/main.py`
- API client: `frontend/lib/api.ts`
- Env config: `.env` (root, shared by all services)

## Critical Issues Known
1. Python agents load `.env` via relative path (`../../.env`) — MUST be started from within their own directory
2. Several frontend pages hardcode `http://localhost:5000/api/...` instead of using `lib/api.ts`
3. `NEXT_PUBLIC_API_URL` and `OCR_SERVICE_URL` missing from `.env` (fallbacks work locally)
4. In-memory pipeline status in orchestrator (not persisted across restarts)
5. Resume parser is regex-based only (60 predefined skills), not LLM/true OCR

## Architecture Notes
- All Python agents use LangChain + Gemini 2.5 Flash
- Orchestrator runs Planner+Research in parallel (asyncio.gather), then Monitor, then Documentation
- `POST /api/projects/with-agents` triggers the full pipeline via orchestrator
- Skill-based task assignment: backend scores members by requiredSkills overlap
- Monitor auto-runs every 5h via node-cron pattern `0 */5 * * *`

## User System
- One user type: Students
- Username = email
- Per-project roles: leader (creator) / member
- Leader adds members by form or PDF resume upload
- Default password for auto-created accounts: `smartpm123`
- JWT stored in localStorage, 7-day expiry

## See Also
- `memory/patterns.md` — code patterns and conventions
- `memory/issues.md` — detailed issue tracking
