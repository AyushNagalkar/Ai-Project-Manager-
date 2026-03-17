import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import json
import re
import traceback

load_dotenv(dotenv_path='../../.env')

app = FastAPI(title="Planner Agent", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM via OpenRouter
llm = ChatOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
    model="stepfun/step-3.5-flash:free",
    temperature=0.7
)

# ── Request Model ────────────────────────────────────
class PlanRequest(BaseModel):
    projectTitle: str
    domain: str
    problemStatement: str
    teamMembers: List[str] = []

# ── Response Models (Phase-centric) ──────────────────
class TaskItem(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    estimatedHours: int = 8
    requiredSkills: List[str] = []
    dependencies: List[str] = []

class Phase(BaseModel):
    name: str
    description: str
    duration: str
    startWeek: int = 1
    endWeek: int = 2
    deliverables: List[str] = []
    tasks: List[TaskItem] = []

class Timeline(BaseModel):
    totalDuration: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    phases: List[Dict[str, Any]] = []

class PlanResponse(BaseModel):
    phases: List[Phase]
    timeline: Timeline
    recommendations: List[str]

def parse_llm_json(content: str) -> dict:
    """Robustly parse JSON from LLM response."""
    content = content.strip()
    
    # Try to extract JSON from markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
    if json_match:
        content = json_match.group(1)
    
    # Remove any leading/trailing non-JSON text
    start = content.find('{')
    end = content.rfind('}')
    if start != -1 and end != -1:
        content = content[start:end+1]
    
    return json.loads(content)

@app.get("/")
async def root():
    return {"agent": "Planner", "status": "active", "version": "2.0.0"}

@app.post("/plan", response_model=PlanResponse)
async def generate_plan(request: PlanRequest):
    """
    Generate a phase-centric project plan with nested tasks, required skills, and timeline.
    """
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert project planning AI agent for student academic projects.
Generate a comprehensive, phase-centric project plan. Return ONLY valid JSON, no markdown code blocks.

The JSON MUST match this exact structure:
{{
  "phases": [
    {{
      "name": "Phase 1: Planning & Requirements",
      "description": "Gather requirements and plan the project",
      "duration": "2 weeks",
      "startWeek": 1,
      "endWeek": 2,
      "deliverables": ["SRS Document", "Project Plan"],
      "tasks": [
        {{
          "title": "Requirements Gathering",
          "description": "Conduct stakeholder interviews and document requirements",
          "priority": "high",
          "estimatedHours": 16,
          "requiredSkills": ["Python", "System Design", "MongoDB", "Communication"],
          "dependencies": []
        }}
      ]
    }}
  ],
  "timeline": {{
    "totalDuration": "12 weeks",
    "startDate": null,
    "endDate": null,
    "phases": [
      {{"name": "Phase 1", "weeks": "1-2"}}
    ]
  }},
  "recommendations": [
    "Start with CI/CD pipeline setup early",
    "Schedule weekly standups"
  ]
}}

IMPORTANT RULES:
- Create 4-6 phases covering the full project lifecycle
- Each phase should have 3-6 tasks
- requiredSkills MUST be specific, highly recognized technical languages, frameworks, or domains (e.g., "React.js", "Python", "MongoDB", "AWS", "UI/UX"). Do NOT use generic tags like "Frontend" or "Developing" unless unavoidable.
- priority must be "high", "medium", or "low"
- estimatedHours should be realistic for students
- Include dependencies between tasks where logical
- Return raw JSON only, NO markdown formatting"""),
            ("user", """Project Title: {title}
Domain: {domain}
Problem Statement: {problem}
Team Size: {team_size} members ({member_names})

Generate a detailed, phase-centric project plan. Return ONLY the JSON.""")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "title": request.projectTitle,
            "domain": request.domain,
            "problem": request.problemStatement,
            "team_size": max(len(request.teamMembers), 1),
            "member_names": ", ".join(request.teamMembers) if request.teamMembers else "1 member"
        })
        
        try:
            result = parse_llm_json(response.content)
        except (json.JSONDecodeError, ValueError) as je:
            print(f"JSON parse error: {je}")
            print(f"Raw content: {response.content[:500]}")
            # Fallback with phase-centric structure
            result = {
                "phases": [
                    {
                        "name": "Phase 1: Planning & Design",
                        "description": "Initial project setup, requirements gathering, and system design",
                        "duration": "2 weeks", "startWeek": 1, "endWeek": 2,
                        "deliverables": ["Requirements Document", "System Architecture"],
                        "tasks": [
                            {"title": "Requirements Analysis", "description": f"Analyze requirements for {request.projectTitle}", "priority": "high", "estimatedHours": 16, "requiredSkills": ["Research", "Documentation"], "dependencies": []},
                            {"title": "System Design", "description": "Design system architecture and database schema", "priority": "high", "estimatedHours": 24, "requiredSkills": ["System Design", request.domain], "dependencies": ["Requirements Analysis"]}
                        ]
                    },
                    {
                        "name": "Phase 2: Core Development",
                        "description": "Implement the core features and functionality",
                        "duration": "4 weeks", "startWeek": 3, "endWeek": 6,
                        "deliverables": ["Working Prototype", "Core Features"],
                        "tasks": [
                            {"title": "Backend Development", "description": "Build backend APIs and database layer", "priority": "high", "estimatedHours": 40, "requiredSkills": ["Python", "Database", "API"], "dependencies": ["System Design"]},
                            {"title": "Frontend Development", "description": "Build user interface", "priority": "high", "estimatedHours": 40, "requiredSkills": ["JavaScript", "React", "CSS"], "dependencies": ["System Design"]},
                            {"title": "Integration", "description": "Connect frontend with backend", "priority": "medium", "estimatedHours": 16, "requiredSkills": ["Full Stack"], "dependencies": ["Backend Development", "Frontend Development"]}
                        ]
                    },
                    {
                        "name": "Phase 3: Testing & Documentation",
                        "description": "Test all features and prepare documentation",
                        "duration": "3 weeks", "startWeek": 7, "endWeek": 9,
                        "deliverables": ["Test Report", "User Manual"],
                        "tasks": [
                            {"title": "Testing", "description": "Comprehensive testing of all features", "priority": "high", "estimatedHours": 32, "requiredSkills": ["Testing", "QA"], "dependencies": ["Integration"]},
                            {"title": "Documentation", "description": "Write technical and user documentation", "priority": "medium", "estimatedHours": 20, "requiredSkills": ["Writing", "Documentation"], "dependencies": ["Testing"]}
                        ]
                    },
                    {
                        "name": "Phase 4: Deployment & Presentation",
                        "description": "Deploy the system and prepare final presentation",
                        "duration": "2 weeks", "startWeek": 10, "endWeek": 11,
                        "deliverables": ["Deployed System", "Final Presentation"],
                        "tasks": [
                            {"title": "Deployment", "description": "Deploy application to production", "priority": "high", "estimatedHours": 16, "requiredSkills": ["DevOps", "Cloud"], "dependencies": ["Testing"]},
                            {"title": "Final Presentation", "description": "Prepare and rehearse final presentation", "priority": "high", "estimatedHours": 12, "requiredSkills": ["Presentation", "Communication"], "dependencies": ["Documentation"]}
                        ]
                    }
                ],
                "timeline": {"totalDuration": "11 weeks", "phases": [{"name": "Planning", "weeks": "1-2"}, {"name": "Development", "weeks": "3-6"}, {"name": "Testing", "weeks": "7-9"}, {"name": "Deployment", "weeks": "10-11"}]},
                "recommendations": [f"Focus on {request.domain} best practices", "Use version control from day 1", "Schedule weekly team meetings", "Start testing early"]
            }
        
        return PlanResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Planner agent error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Planning error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
