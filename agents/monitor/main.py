import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import json
import re
import traceback

load_dotenv(dotenv_path='../../.env')

app = FastAPI(title="Monitor Agent", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
    model="stepfun/step-3.5-flash:free",
    temperature=0.5
)

# ── Request Models ─────────────────────────────
class TaskInfo(BaseModel):
    title: str
    status: str
    deadline: Optional[str] = None
    assignedTo: Optional[str] = None
    phase: Optional[str] = ""

class MemberPerf(BaseModel):
    memberEmail: str = ""
    memberName: str = ""
    tasksAssigned: int = 0
    tasksCompleted: int = 0

class MonitorRequest(BaseModel):
    tasks: List[TaskInfo] = []
    progressLogs: List[Dict[str, Any]] = []
    memberPerformance: List[MemberPerf] = []
    projectDeadline: Optional[str] = None

# ── Response Models ────────────────────────────
class Risk(BaseModel):
    level: str
    description: str
    mitigation: str
    impact: str

class Delay(BaseModel):
    taskTitle: str
    expectedDate: str = ""
    reason: str
    recommendation: str

class MemberPerfOutput(BaseModel):
    memberEmail: str = ""
    memberName: str = ""
    tasksAssigned: int = 0
    tasksCompleted: int = 0
    onTrack: bool = True
    feedback: str = ""

class MonitorResponse(BaseModel):
    progress: int
    riskLevel: str
    assessmentInterval: str = "5 hours"
    nextAssessmentAt: Optional[str] = None
    risks: List[Risk] = []
    delays: List[Delay] = []
    memberPerformance: List[MemberPerfOutput] = []
    insights: List[str] = []
    recommendations: List[str] = []

def parse_llm_json(content: str) -> dict:
    content = content.strip()
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
    if json_match:
        content = json_match.group(1)
    start = content.find('{')
    end = content.rfind('}')
    if start != -1 and end != -1:
        content = content[start:end+1]
    return json.loads(content)

@app.get("/")
async def root():
    return {"agent": "Monitor", "status": "active", "version": "2.0.0"}

@app.post("/monitor", response_model=MonitorResponse)
async def monitor_progress(request: MonitorRequest):
    """
    Monitor project progress with member performance tracking.
    Designed to run every 5 hours automatically.
    """
    try:
        total_tasks = len(request.tasks)
        completed_tasks = len([t for t in request.tasks if t.status == "completed"])
        in_progress = len([t for t in request.tasks if t.status == "in-progress"])
        todo = total_tasks - completed_tasks - in_progress

        # Build member performance summary
        member_summary = ""
        for mp in request.memberPerformance:
            member_summary += f"\n  - {mp.memberName} ({mp.memberEmail}): {mp.tasksCompleted}/{mp.tasksAssigned} tasks completed"

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert project monitoring AI agent. Analyze project progress, identify risks, detect delays, and assess each team member's performance.

Return ONLY valid JSON matching this structure:
{{
  "progress": 45,
  "riskLevel": "low|medium|high|critical",
  "assessmentInterval": "5 hours",
  "nextAssessmentAt": null,
  "risks": [
    {{
      "level": "medium",
      "description": "Description of the risk",
      "mitigation": "How to mitigate this risk",
      "impact": "What happens if not addressed"
    }}
  ],
  "delays": [
    {{
      "taskTitle": "Delayed task name",
      "expectedDate": "2024-03-15",
      "reason": "Why it's delayed",
      "recommendation": "How to get back on track"
    }}
  ],
  "memberPerformance": [
    {{
      "memberEmail": "email@example.com",
      "memberName": "Student Name",
      "tasksAssigned": 5,
      "tasksCompleted": 3,
      "onTrack": true,
      "feedback": "Performing well, ahead on frontend tasks"
    }}
  ],
  "insights": ["Team velocity is increasing", "Documentation is behind"],
  "recommendations": ["Hold a risk review meeting", "Reallocate tasks from overloaded members"]
}}

Be realistic, actionable, and specific. Return raw JSON only."""),
            ("user", """Project Status:
- Total Tasks: {total}
- Completed: {completed}
- In Progress: {in_progress}
- Todo: {todo}
- Project Deadline: {deadline}

Team Performance:{member_perf}

Tasks Details:
{tasks_data}

Analyze this project and provide a comprehensive monitoring assessment.""")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "total": total_tasks,
            "completed": completed_tasks,
            "in_progress": in_progress,
            "todo": todo,
            "deadline": request.projectDeadline or "Not set",
            "member_perf": member_summary or "\n  No member data available",
            "tasks_data": "\n".join([f"  - [{t.status}] {t.title} (assigned: {t.assignedTo or 'Unassigned'}, phase: {t.phase or 'N/A'})" for t in request.tasks[:20]])
        })
        
        try:
            result = parse_llm_json(response.content)
        except (json.JSONDecodeError, ValueError):
            progress = int(completed_tasks * 100 / total_tasks) if total_tasks > 0 else 0
            result = {
                "progress": progress,
                "riskLevel": "medium" if progress < 50 else "low",
                "assessmentInterval": "5 hours",
                "risks": [],
                "delays": [],
                "memberPerformance": [
                    {"memberEmail": mp.memberEmail, "memberName": mp.memberName, "tasksAssigned": mp.tasksAssigned, "tasksCompleted": mp.tasksCompleted, "onTrack": mp.tasksCompleted >= mp.tasksAssigned // 2, "feedback": ""}
                    for mp in request.memberPerformance
                ],
                "insights": [f"Project is {progress}% complete"],
                "recommendations": ["Update task statuses regularly", "Monitor team velocity"]
            }
        
        # Set next assessment time
        result["nextAssessmentAt"] = (datetime.now() + timedelta(hours=5)).isoformat()
        
        return MonitorResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Monitor agent error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Monitoring error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
