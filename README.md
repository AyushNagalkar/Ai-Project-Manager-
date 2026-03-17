<div align="center">
  <h1>🚀 SmartPM (AI-Powered Project Manager)</h1>
  <p>An intelligent, multi-agent project management ecosystem designed for student academic projects.</p>
</div>

---

## 📖 Overview

SmartPM replaces manual project planning and tracking with a suite of **5 Specialized AI Agents**. It automatically plans project phases, conducts domain research, monitors progress, and generates multi-format academic documentation (reports, research papers, presentations, etc.).

It also features **Skill-Based Task Assignment** via an integrated OCR Resume Parser, automatically assigning students tasks that best match their technical skills.

## ✨ Core Features

- **🤖 5-Agent Orchestration:** 
  - **Planner Agent:** Generates phase-centric plans, schedules, and specific skill-dependent tasks.
  - **Research Agent:** Finds relevant papers, articles, datasets, news, and tools, generating automatic Google Scholar, arXiv, Kaggle, and HuggingFace links.
  - **Monitor Agent:** Runs automatically every 5 hours to track team velocity, identify delays, and flag project risks.
  - **Documentation Agent:** Generates 4 formats of project documentation automatically (Markdown Reports, Research Papers, Book Chapters, Presentations).
  - **Resume Parser (OCR):** Extracts skills from student PDFs using PyMuPDF and pdfplumber.
- **🎯 Smart Task Distribution:** Assigns tasks to team members based on required skills vs extracted skills, using weighted scoring and workload balancing.
- **📈 Progress Tracking:** Real-time dashboard of completed tasks, active phases, and member performance.

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** Next.js (React), Tailwind CSS
- **AI Agents:** Python, FastAPI, LangChain, OpenRouter (LLM routing)
- **OCR:** PyMuPDF (fitz), pdfplumber
- **Orchestration:** Python (handles concurrent agent execution)

---

## 📂 Project Structure

```text
├── agents/                   # Python FastAPI AI Agents
│   ├── planner/              # Phase structuring & task generation
│   ├── research/             # Domain research & reference gathering
│   ├── monitor/              # Risk assessment & progress tracking
│   ├── documentation/        # Automated doc generation (Report/PPT/Viva)
│   └── resume-parser/        # OCR PDF extraction for student profiles
├── backend-node/             # Primary Node.js REST API
│   ├── src/controllers/      # Auth, Projects, Tasks, Agent triggers
│   ├── src/models/           # MongoDB schemas
│   └── src/scheduler.js      # 5-hour cron job for Monitor Agent
├── frontend/                 # Next.js Web Interface
├── orchestrator/             # Python-based multi-agent execution pipeline
└── .env                      # Environment configurations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- MongoDB instance (local or Atlas)
- OpenRouter API Key

### 1. Environment Setup
Create a `.env` file in the root directory (copy from `.env.example`):
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster...
OPENROUTER_API_KEY=sk-or-v1-...
JWT_SECRET=your_super_secret_key
NODE_ENV=development
PORT=5000

# Service Ports
PLANNER_SERVICE_URL=http://localhost:8001
RESEARCH_SERVICE_URL=http://localhost:8002
MONITOR_SERVICE_URL=http://localhost:8003
DOC_SERVICE_URL=http://localhost:8004
RESUME_PARSER_URL=http://localhost:8005
ORCHESTRATOR_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 2. Installation
You can use the provided Windows batch/powershell scripts to auto-install all dependencies:
```powershell
.\install-all.ps1
```

### 3. Running the Ecosystem
```powershell
.\start-all.ps1
```
This will spin up:
- 5 Python FastAPI Agents (Ports 8001-8005)
- Python Orchestrator (Port 8000)
- Node.js Backend API (Port 5000)
- Next.js Frontend (Port 3000)

Access the UI at: `http://localhost:3000`

---

## 🧠 How the AI Pipeline Works

1. **Project Creation:** A leader creates a project and uploads teammate resumes. The Resume Parser extracts technical skills from the PDFs.
2. **Orchestration:** The Node backend calls the Orchestrator, which triggers the Planner and Research agents concurrently.
3. **Smart Assignment:** The planner outputs tasks with `requiredSkills`. The backend runs a weighted-score matching algorithm to distribute tasks to the best-suited students, keeping workloads balanced.
4. **Monitoring:** Every 5 hours, a Node `cron` job pings the Monitor Agent with the current task statuses. The agent returns a risk profile and highlights delays.
5. **Documentation:** Users can trigger the Documentation Agent at any time to compile all completed tasks, research papers, and current project state into LaTeX/Markdown-ready reports.

---

## 🤝 Contribution Guidelines
When improving the system:
1. Ensure the agents always return strictly valid JSON (No markdown fences around JSON output).
2. The `resume-parser` uses `PyMuPDF` with a `pdfplumber` fallback. Ensure binary dependencies are installed.
3. Keep the Node.js backend as the single source of truth for the Database. Python agents should remain stateless.
