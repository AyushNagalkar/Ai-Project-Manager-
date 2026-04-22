# SmartPM: An AI-Driven Multi-Agent Microservices Framework for Skill-Aware Project Management in Educational Teams

**Abstract**—Project-based learning (PBL) builds practical competence, but student teams frequently lose substantial time to non-technical overhead: defining a work breakdown structure, distributing tasks fairly, collecting domain literature, tracking risks, and repeatedly producing academic deliverables. This paper presents **SmartPM**, a full-stack project management system that integrates conventional project/task tracking with a coordinated set of AI agents. SmartPM uses a microservices architecture with a Next.js frontend, a Node.js/Express backend with MongoDB persistence, and a Python FastAPI orchestration layer. Four LLM-backed agents—Planner, Research, Monitor, and Documentation—are implemented as independent Python services using LangChain prompt templates and OpenRouter model routing (configured in the repository as `stepfun/step-3.5-flash:free`). A fifth Python service performs OCR-assisted PDF resume parsing to extract team-member skills, enabling a **skill-based task assignment** algorithm with workload balancing. SmartPM emphasizes reliability through strict JSON contracts, robust response parsing, and persistence of all agent outputs for traceability.

**Index Terms**—Multi-Agent Systems, Large Language Models, Educational Technology, Project Management, Microservices, FastAPI, Next.js, MongoDB, Skill Matching.

---

## I. INTRODUCTION

Academic group projects simulate real software engineering, but student teams face recurring coordination problems: (i) vague requirements, (ii) uneven task allocation, (iii) delayed research/documentation, and (iv) poor visibility into progress and risks. While agile tools such as boards and issue trackers can organize work, they remain primarily **passive**—teams must manually create and maintain plans, research summaries, and reports.

Recent advances in large language models (LLMs) enable systems that can generate structured plans, synthesize literature, and draft documentation. However, practical deployment requires addressing two engineering constraints: (1) outputs must be machine-readable and stable (not free-form prose), and (2) LLM latency/failure must not block core application functions.

SmartPM is designed around these constraints. It treats LLM functionality as **specialized services** behind strict JSON contracts, coordinated by an orchestrator, and integrated into a persistent project management backend.

## II. LITERATURE SURVEY

### A. Educational Project Management
Educational settings often adopt agile practices to develop collaboration skills, but administrative overhead can dominate when teams must continuously curate backlogs and documentation manually.

### B. LLMs for Multi-Step Engineering Tasks
LLMs have demonstrated strong performance in planning and synthesis tasks when guided by structured prompting and intermediate reasoning (e.g., chain-of-thought). For real systems, these capabilities must be constrained into deterministic schemas and validated to avoid downstream failures.

### C. Multi-Agent LLM Systems
Multi-agent approaches decompose a complex workflow into specialized roles, improving modularity, enabling parallel execution, and isolating failures. Frameworks such as LangChain provide abstractions for prompt templating and model invocation.

SmartPM operationalizes these principles for student teams by implementing a multi-agent, microservices-based project manager with skill-aware task assignment.

## III. METHODOLOGY

### A. Design Goals

SmartPM’s implementation follows four engineering goals:

1) **Structured outputs**: agents return JSON suitable for storage and rendering.
2) **Service isolation**: LLM compute is separated from CRUD operations.
3) **Traceability**: all agent results are persisted in MongoDB.
4) **Skill-aware delegation**: assignments reflect team skills and balance workload.

### B. System Architecture

SmartPM is implemented as a microservices ecosystem.

```mermaid
flowchart TB
  U[User
  Browser] --> FE[Frontend
  Next.js 14 (3000)]
  FE -->|REST + JWT| BE[Backend API
  Node.js + Express (5000)]
  BE --> DB[(MongoDB
  users/projects/tasks/...)]

  BE -->|HTTP| ORCH[Orchestrator
  FastAPI (8000)]

  subgraph AgentServices[Python FastAPI Services]
    P[Planner
    POST /plan (8001)]
    R[Research
    POST /research (8002)]
    M[Monitor
    POST /monitor (8003)]
    D[Documentation
    POST /generate-docs (8004)]
    O[Resume Parser
    POST /parse-resume (8005)]
  end

  ORCH -->|asyncio.gather| P
  ORCH -->|asyncio.gather| R
  ORCH -->|sequential| M
  ORCH -->|sequential| D
  BE -->|multipart PDF| O
```

**Table I: Service and Port Map (Repository Defaults)**

| Service | Implementation | Default Port | Function |
|---|---|---:|---|
| Frontend | Next.js + Tailwind | 3000 | UI and visualization |
| Backend API | Express + Mongoose | 5000 | Auth + CRUD + agent gateway |
| Orchestrator | FastAPI + httpx | 8000 | Coordinates agent pipeline |
| Planner Agent | FastAPI + LangChain | 8001 | Generates phase-centric plan |
| Research Agent | FastAPI + LangChain | 8002 | Collects papers/datasets/tools |
| Monitor Agent | FastAPI + LangChain | 8003 | Risk + progress assessment |
| Documentation Agent | FastAPI + LangChain | 8004 | Generates multi-format docs |
| Resume Parser | FastAPI + PyMuPDF/pdfplumber | 8005 | Extracts skills from PDFs |

### C. Backend REST API

All backend routes are protected by JWT authentication except register/login.

**Table II: Backend Endpoints (Implemented Routes)**

| Area | Method | Path |
|---|---|---|
| Auth | POST | `/api/auth/register` |
| Auth | POST | `/api/auth/login` |
| Auth | GET | `/api/auth/profile` |
| Auth | PUT | `/api/auth/profile` |
| Projects | POST | `/api/projects` |
| Projects | POST | `/api/projects/with-agents` |
| Projects | GET | `/api/projects` |
| Projects | GET | `/api/projects/:id` |
| Projects | PUT | `/api/projects/:id` |
| Projects | DELETE | `/api/projects/:id` |
| Tasks | POST | `/api/tasks` |
| Tasks | GET | `/api/tasks/project/:projectId` |
| Tasks | GET | `/api/tasks/:id` |
| Tasks | PUT | `/api/tasks/:id` |
| Tasks | PATCH | `/api/tasks/:id/complete` |
| Tasks | PATCH | `/api/tasks/:id/uncomplete` |
| Tasks | DELETE | `/api/tasks/:id` |
| Agents | POST | `/api/agents/planner` |
| Agents | POST | `/api/agents/research` |
| Agents | POST | `/api/agents/monitor` |
| Agents | POST | `/api/agents/documentation` |
| Agents | GET | `/api/agents/outputs/:projectId` |
| Agents | GET | `/api/agents/documents/:projectId` |
| Agents | GET | `/api/agents/progress/:projectId` |
| Members | POST | `/api/projects/:id/members` |
| Members | POST | `/api/projects/:id/members/upload-resume` |
| Members | GET | `/api/projects/:id/members` |
| Members | DELETE | `/api/projects/:id/members/:userId` |

### D. Agent Contracts and Reliability

Each LLM agent uses LangChain prompt templates and the OpenRouter gateway. Because downstream systems expect JSON, each agent implements a robust JSON extraction function that removes code fences and trims surrounding text before parsing.

**Table III: Agent I/O Contracts (Conceptual Summary)**

| Agent | Inputs | Outputs |
|---|---|---|
| Planner | project metadata, team member names | `phases[]` with `tasks[]`, `timeline`, `recommendations[]` |
| Research | domain + keywords | `papers[]`, `datasets[]`, `tools[]`, `summary`, `recommendations[]` |
| Monitor | task states + member performance | `progress`, `riskLevel`, `risks[]`, `delays[]`, `insights[]` |
| Documentation | project + tasks + research | structured sections + export formats |
| Resume Parser | PDF resume file | extracted `skills[]` plus identity hints |

### E. Skill-Based Task Assignment

SmartPM assigns tasks to members using an auditable scoring policy:

1) Normalize skills with a synonym map (e.g., `js → javascript`, `react → react.js`).
2) Score each member against `requiredSkills[]`.
   - exact match: +3
   - partial substring match: +1
3) Resolve ties using workload balancing (prefer fewer assignments).
4) If no skill match exists, assign to the least-loaded member.

This approach is intentionally deterministic and explainable for classroom environments.

### F. Scheduled Monitoring

The backend runs an automated monitor job every **5 hours**. For active projects it gathers tasks and member performance, calls the Monitor Agent, and persists:

1) an `AgentOutput` record, and
2) a `ProgressLog` record (completion, risks, delays).

### G. Persistence Model

SmartPM persists both operational state and agent outputs.

**Table IV: MongoDB Collections (Implemented Models)**

| Collection | Purpose |
|---|---|
| `users` | Auth + user skill profile |
| `projects` | Project metadata and membership |
| `tasks` | Phase tasks and assignment |
| `agentoutputs` | Persisted JSON outputs per agent |
| `progresslogs` | Time-series monitoring records |
| `documents` | Generated report/paper/slides content |

## IV. RESULTS AND DISCUSSION

### A. Functional Coverage

SmartPM supports an end-to-end academic workflow: register/login, create projects, add members, upload resumes (PDF), run agents, store outputs, render results in the UI, and run periodic monitoring.

### B. Concurrency and Isolation

The orchestrator executes the Planner and Research services concurrently (`asyncio.gather`) and then runs Monitor and Documentation sequentially. This reduces total pipeline wall-clock time compared to a purely sequential design, while service isolation prevents LLM failures from breaking core CRUD functionality.

### C. Output Stability

The system’s JSON-first design (parse helpers + fallbacks in each agent) reduces failure due to markdown-wrapped or noisy outputs—one of the most common integration problems in LLM applications.

### D. Assignment Transparency

The current assignment engine trades optimality for explainability. It is appropriate for educational settings because instructors and students can understand why a task was assigned to a member. Limitations include inconsistent skill naming and inability to model proficiency depth.

### E. Environment Reproducibility

The repository centralizes configuration via environment variables.

**Table V: Key Environment Variables (Excerpt)**

| Variable | Used By | Meaning |
|---|---|---|
| `MONGO_URI` | Backend | MongoDB connection string |
| `JWT_SECRET` | Backend | Token signing secret |
| `OPENROUTER_API_KEY` | Agents | OpenRouter API key |
| `ORCHESTRATOR_URL` | Backend | Orchestrator URL |
| `PLANNER_SERVICE_URL` | Orchestrator/Backend | Planner URL |
| `RESEARCH_SERVICE_URL` | Orchestrator/Backend | Research URL |
| `MONITOR_SERVICE_URL` | Orchestrator/Backend | Monitor URL |
| `DOC_SERVICE_URL` | Orchestrator/Backend | Documentation URL |
| `OCR_SERVICE_URL` | Backend | Resume parser URL |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API base |

## V. CONCLUSION AND FUTURE WORK

SmartPM demonstrates a practical agentic architecture for educational project management: persistent CRUD core, specialized AI microservices behind strict JSON contracts, skill-aware task assignment augmented by resume parsing, and automated progress monitoring. The system is modular and extensible, allowing future improvements without rewriting the core web application.

Future work includes (i) collecting empirical study data from real student teams (time-to-plan, assignment fairness, monitoring usefulness), (ii) enhancing observability (token usage, timeouts, error classes), and (iii) improving skill matching via semantic methods while preserving interpretability.

## VI. REFERENCES

[1] T. Brown *et al*., “Language Models are Few-Shot Learners,” in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 33, 2020.

[2] S. Wei *et al*., “Chain-of-Thought Prompting Elicits Reasoning in Large Language Models,” 2022. [Online]. Available: https://arxiv.org/abs/2201.11903

[3] S. Yao *et al*., “ReAct: Synergizing Reasoning and Acting in Language Models,” 2022. [Online]. Available: https://arxiv.org/abs/2210.03629

[4] M. Wooldridge, *An Introduction to MultiAgent Systems*, 2nd ed. Wiley, 2009.

[5] “FastAPI Documentation,” [Online]. Available: https://fastapi.tiangolo.com/

[6] “LangChain Documentation,” [Online]. Available: https://python.langchain.com/

[7] “Next.js Documentation,” [Online]. Available: https://nextjs.org/docs

[8] “MongoDB Documentation,” [Online]. Available: https://www.mongodb.com/docs/

[9] “Express Documentation,” [Online]. Available: https://expressjs.com/

[10] “OpenRouter API Documentation,” [Online]. Available: https://openrouter.ai/docs

[11] “node-cron Documentation,” [Online]. Available: https://www.npmjs.com/package/node-cron