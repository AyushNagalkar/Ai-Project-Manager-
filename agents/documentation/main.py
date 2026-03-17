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

app = FastAPI(title="Documentation Agent", version="2.0.0")

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
    temperature=0.7
)

# ── Request Models ─────────────────────────────
class ProjectInfo(BaseModel):
    title: str
    domain: str
    problemStatement: str

class TaskInfo(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    phase: Optional[str] = ""

class ResearchInfo(BaseModel):
    papers: List[Dict[str, Any]] = []
    tools: List[Dict[str, Any]] = []

class DocRequest(BaseModel):
    project: ProjectInfo
    tasks: List[TaskInfo] = []
    research: ResearchInfo = ResearchInfo()

# ── Response Models ────────────────────────────
class DocumentContent(BaseModel):
    title: str = ""
    abstract: str = ""
    introduction: str = ""
    literatureReview: str = ""
    methodology: str = ""
    implementation: str = ""
    results: str = ""
    conclusion: str = ""
    references: List[str] = []

class Slide(BaseModel):
    slideNumber: int
    title: str
    content: List[str]
    notes: str = ""

class VivaQuestion(BaseModel):
    question: str
    suggestedAnswer: str
    category: str

class ExportFormats(BaseModel):
    report: str = ""
    researchPaper: str = ""
    bookChapter: str = ""
    presentation: str = ""

class DocResponse(BaseModel):
    document: DocumentContent
    pptOutline: List[Slide] = []
    vivaQuestions: List[VivaQuestion] = []
    exportFormats: ExportFormats = ExportFormats()

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
    return {"agent": "Documentation", "status": "active", "version": "2.0.0"}

@app.post("/generate-docs", response_model=DocResponse)
async def generate_documentation(request: DocRequest):
    """
    Generate comprehensive project documentation with multi-format export support.
    Supports: Report, Research Paper, Book Chapter, Presentation.
    """
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert academic documentation AI agent. Generate comprehensive project documentation that can be exported in multiple formats.

Return ONLY valid JSON matching this structure:
{{
  "document": {{
    "title": "Full Project Title",
    "abstract": "A concise 200-word abstract summarizing the project...",
    "introduction": "Detailed introduction section (500+ words) covering background, problem statement, objectives, and scope...",
    "literatureReview": "Review of related work and existing solutions (400+ words)...",
    "methodology": "Description of the approach and methodology used (400+ words)...",
    "implementation": "Implementation details including architecture, tools, and technologies (400+ words)...",
    "results": "Expected or achieved results, analysis, and discussion (300+ words)...",
    "conclusion": "Conclusion with summary of contributions and future work (200+ words)...",
    "references": ["[1] Author, Title, Journal, Year", "[2] Author, Title, Conf, Year"]
  }},
  "pptOutline": [
    {{
      "slideNumber": 1,
      "title": "Project Introduction",
      "content": ["Point 1", "Point 2", "Point 3"],
      "notes": "Speaker notes for this slide"
    }}
  ],
  "vivaQuestions": [
    {{
      "question": "Why did you choose this approach?",
      "suggestedAnswer": "We chose this approach because...",
      "category": "technical|conceptual|implementation|future-work"
    }}
  ],
  "exportFormats": {{
    "report": "Full formatted academic report in markdown...",
    "researchPaper": "Condensed version suitable for conference/journal submission...",
    "bookChapter": "Expanded version with detailed literature review...",
    "presentation": "Slide-by-slide summary with key talking points..."
  }}
}}

RULES:
- Make the document COMPREHENSIVE and PROFESSIONAL
- Include 10-15 slides in the PPT outline
- Include 8-10 viva questions across all categories
- Export formats should contain ACTUAL CONTENT, not placeholders
- The report format should be a complete academic report in markdown
- The research paper should be concise and focused
- The book chapter should be the most detailed version
- Return raw JSON only"""),
            ("user", """Project Title: {title}
Domain: {domain}
Problem Statement: {problem}

Tasks ({task_count} total):
{tasks_summary}

Research Papers: {papers_count} papers found
Tools Used: {tools_list}

Generate comprehensive documentation with all export formats.""")
        ])
        
        # Build tasks summary
        tasks_by_phase = {}
        for t in request.tasks:
            phase = t.phase or "General"
            if phase not in tasks_by_phase:
                tasks_by_phase[phase] = []
            tasks_by_phase[phase].append(f"  - [{t.status}] {t.title}")
        
        tasks_summary = ""
        for phase, phase_tasks in tasks_by_phase.items():
            tasks_summary += f"\n{phase}:\n" + "\n".join(phase_tasks[:5])

        tools_list = ", ".join([t.get("name", "") for t in request.research.tools[:5]]) or "Not specified"

        chain = prompt | llm
        response = chain.invoke({
            "title": request.project.title,
            "domain": request.project.domain,
            "problem": request.project.problemStatement,
            "task_count": len(request.tasks),
            "tasks_summary": tasks_summary or "No tasks defined yet",
            "papers_count": len(request.research.papers),
            "tools_list": tools_list
        })
        
        try:
            result = parse_llm_json(response.content)
        except (json.JSONDecodeError, ValueError):
            # Fallback
            result = {
                "document": {
                    "title": request.project.title,
                    "abstract": f"This project focuses on {request.project.problemStatement}",
                    "introduction": f"# Introduction\n\n{request.project.problemStatement}\n\nThis project is in the domain of {request.project.domain}.",
                    "literatureReview": "Literature review to be expanded.",
                    "methodology": "Methodology to be defined.",
                    "implementation": "Implementation details to be documented.",
                    "results": "Results to be documented.",
                    "conclusion": "Conclusion to be written.",
                    "references": []
                },
                "pptOutline": [
                    {"slideNumber": 1, "title": "Introduction", "content": ["Project overview", "Problem statement"], "notes": ""},
                    {"slideNumber": 2, "title": "Methodology", "content": ["Approach", "Tools used"], "notes": ""},
                    {"slideNumber": 3, "title": "Conclusion", "content": ["Summary", "Future work"], "notes": ""}
                ],
                "vivaQuestions": [
                    {"question": "What is the project about?", "suggestedAnswer": request.project.problemStatement, "category": "conceptual"}
                ],
                "exportFormats": {
                    "report": f"# {request.project.title}\n\n{request.project.problemStatement}",
                    "researchPaper": f"# {request.project.title}\n\nAbstract: {request.project.problemStatement}",
                    "bookChapter": f"# Chapter: {request.project.title}\n\n{request.project.problemStatement}",
                    "presentation": f"Slide 1: {request.project.title}\nSlide 2: Problem Statement"
                }
            }
        
        return DocResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Documentation agent error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Documentation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
