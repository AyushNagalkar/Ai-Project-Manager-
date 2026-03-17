import os
import httpx
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

load_dotenv(dotenv_path='../.env')

app = FastAPI(title="SmartPM Orchestrator", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Service URLs ────────────────────────────────
PLANNER_URL = os.getenv("PLANNER_SERVICE_URL", "http://localhost:8001")
RESEARCH_URL = os.getenv("RESEARCH_SERVICE_URL", "http://localhost:8002")
MONITOR_URL = os.getenv("MONITOR_SERVICE_URL", "http://localhost:8003")
DOC_URL = os.getenv("DOC_SERVICE_URL", "http://localhost:8004")
RESUME_PARSER_URL = os.getenv("RESUME_PARSER_URL", "http://localhost:8005")

# ── Request Models ──────────────────────────────
class PipelineRequest(BaseModel):
    projectTitle: str
    domain: str
    problemStatement: str
    teamMembers: List[str] = []

class MonitorRequest(BaseModel):
    tasks: List[Dict[str, Any]] = []
    progressLogs: List[Dict[str, Any]] = []
    memberPerformance: List[Dict[str, Any]] = []
    projectDeadline: Optional[str] = None

# ── Status Tracking ─────────────────────────────
pipeline_status: Dict[str, Any] = {}

@app.get("/")
async def root():
    return {"service": "SmartPM Orchestrator", "status": "active", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    """Check health of all agent services."""
    agents = {}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for name, url in [("planner", PLANNER_URL), ("research", RESEARCH_URL), ("monitor", MONITOR_URL), ("documentation", DOC_URL), ("resume-parser", RESUME_PARSER_URL)]:
            try:
                response = await client.get(f"{url}/")
                if response.status_code == 200:
                    agents[name] = "healthy"
                else:
                    agents[name] = "unhealthy"
            except Exception:
                agents[name] = "offline"
    
    all_healthy = all(s == "healthy" for s in agents.values())
    return {
        "status": "healthy" if all_healthy else "degraded",
        "agents": agents
    }

@app.post("/orchestrate/full-pipeline")
async def full_pipeline(request: PipelineRequest):
    """
    Execute the full agent pipeline:
    1. Planner → generates phases & tasks
    2. Research → gathers relevant info (parallel with planner)
    3. Monitor → initial assessment
    4. Documentation → generates docs
    
    Returns all outputs with per-step status.
    """
    pipeline_id = f"{request.projectTitle[:20]}_{id(request)}"
    pipeline_status[pipeline_id] = {"status": "running", "steps": {}}
    
    results = {
        "plannerOutput": None,
        "researchOutput": None,
        "monitorOutput": None,
        "documentationOutput": None,
        "pipelineStatus": {}
    }
    
    async with httpx.AsyncClient(timeout=180.0) as client:
        # Step 1 & 2: Planner and Research run in parallel
        pipeline_status[pipeline_id]["steps"]["planner"] = "running"
        pipeline_status[pipeline_id]["steps"]["research"] = "running"
        
        planner_task = client.post(f"{PLANNER_URL}/plan", json={
            "projectTitle": request.projectTitle,
            "domain": request.domain,
            "problemStatement": request.problemStatement,
            "teamMembers": request.teamMembers
        })
        
        research_task = client.post(f"{RESEARCH_URL}/research", json={
            "domain": request.domain,
            "keywords": [request.projectTitle, request.domain]
        })
        
        # Run planner & research concurrently
        planner_response, research_response = await asyncio.gather(
            planner_task, research_task,
            return_exceptions=True
        )
        
        # Process Planner output
        if isinstance(planner_response, Exception):
            pipeline_status[pipeline_id]["steps"]["planner"] = f"error: {str(planner_response)}"
            results["pipelineStatus"]["planner"] = "failed"
            print(f"❌ Planner error: {planner_response}")
        else:
            try:
                results["plannerOutput"] = planner_response.json()
                pipeline_status[pipeline_id]["steps"]["planner"] = "completed"
                results["pipelineStatus"]["planner"] = "success"
                print(f"✅ Planner completed: {len(results['plannerOutput'].get('phases', []))} phases")
            except Exception as e:
                pipeline_status[pipeline_id]["steps"]["planner"] = f"parse error: {str(e)}"
                results["pipelineStatus"]["planner"] = "failed"
        
        # Process Research output
        if isinstance(research_response, Exception):
            pipeline_status[pipeline_id]["steps"]["research"] = f"error: {str(research_response)}"
            results["pipelineStatus"]["research"] = "failed"
            print(f"❌ Research error: {research_response}")
        else:
            try:
                results["researchOutput"] = research_response.json()
                pipeline_status[pipeline_id]["steps"]["research"] = "completed"
                results["pipelineStatus"]["research"] = "success"
                print(f"✅ Research completed")
            except Exception as e:
                pipeline_status[pipeline_id]["steps"]["research"] = f"parse error: {str(e)}"
                results["pipelineStatus"]["research"] = "failed"
        
        # Step 3: Monitor — initial assessment using planner tasks
        pipeline_status[pipeline_id]["steps"]["monitor"] = "running"
        try:
            tasks_for_monitor = []
            if results["plannerOutput"]:
                for phase in results["plannerOutput"].get("phases", []):
                    for task in phase.get("tasks", []):
                        tasks_for_monitor.append({
                            "title": task.get("title", ""),
                            "status": "todo",
                            "deadline": None,
                            "assignedTo": "Unassigned",
                            "phase": phase.get("name", "")
                        })
            
            monitor_response = await client.post(f"{MONITOR_URL}/monitor", json={
                "tasks": tasks_for_monitor,
                "progressLogs": [],
                "memberPerformance": [],
                "projectDeadline": None
            })
            
            results["monitorOutput"] = monitor_response.json()
            pipeline_status[pipeline_id]["steps"]["monitor"] = "completed"
            results["pipelineStatus"]["monitor"] = "success"
            print(f"✅ Monitor completed: {results['monitorOutput'].get('progress', 0)}% progress")
        except Exception as e:
            pipeline_status[pipeline_id]["steps"]["monitor"] = f"error: {str(e)}"
            results["pipelineStatus"]["monitor"] = "failed"
            print(f"❌ Monitor error: {e}")
        
        # Step 4: Documentation — uses all previous outputs
        pipeline_status[pipeline_id]["steps"]["documentation"] = "running"
        try:
            doc_response = await client.post(f"{DOC_URL}/generate-docs", json={
                "project": {
                    "title": request.projectTitle,
                    "domain": request.domain,
                    "problemStatement": request.problemStatement
                },
                "tasks": tasks_for_monitor[:10] if tasks_for_monitor else [{"title": "Planning", "status": "todo", "phase": "Phase 1"}],
                "research": results["researchOutput"] if results["researchOutput"] else { "papers": [], "tools": [] }
            })
            
            results["documentationOutput"] = doc_response.json()
            pipeline_status[pipeline_id]["steps"]["documentation"] = "completed"
            results["pipelineStatus"]["documentation"] = "success"
            print(f"✅ Documentation completed")
        except Exception as e:
            pipeline_status[pipeline_id]["steps"]["documentation"] = f"error: {str(e)}"
            results["pipelineStatus"]["documentation"] = "failed"
            print(f"❌ Documentation error: {e}")
    
    pipeline_status[pipeline_id]["status"] = "completed"
    
    return results

@app.post("/orchestrate/agent/{agent_name}")
async def run_single_agent(agent_name: str, request: Dict[str, Any]):
    """Run a single agent."""
    agent_urls = {
        "planner": f"{PLANNER_URL}/plan",
        "research": f"{RESEARCH_URL}/research",
        "monitor": f"{MONITOR_URL}/monitor",
        "documentation": f"{DOC_URL}/generate-docs"
    }
    
    url = agent_urls.get(agent_name)
    if not url:
        raise HTTPException(status_code=404, detail=f"Unknown agent: {agent_name}")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=request)
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent {agent_name} error: {str(e)}")

@app.get("/pipeline-status/{pipeline_id}")
async def get_pipeline_status(pipeline_id: str):
    """Get status of a running pipeline."""
    if pipeline_id not in pipeline_status:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline_status[pipeline_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
