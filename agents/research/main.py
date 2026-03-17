import os
import urllib.parse
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

app = FastAPI(title="Research Agent", version="2.0.0")

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
    temperature=0.3
)

# ── Request Model ──────────────────────────────
class ResearchRequest(BaseModel):
    domain: str
    keywords: List[str] = []

# ── Response Models ────────────────────────────
class Paper(BaseModel):
    title: str
    authors: List[str] = []
    year: int = 2024
    abstract: str = ""
    relevance: str = ""
    venue: str = ""            # journal or conference name
    doi: str = ""              # DOI if confidently known, else empty
    searchQuery: str = ""      # Google Scholar search query
    scholarUrl: str = ""       # Autocomputed Google Scholar URL
    arxivUrl: str = ""         # Autocomputed arXiv search URL

class Article(BaseModel):
    title: str
    source: str = ""           # publication name (Medium, Towards Data Science, etc.)
    summary: str = ""
    publishedDate: Optional[str] = None
    searchQuery: str = ""      # search this on the source website
    googleUrl: str = ""        # Autocomputed web search URL

class NewsItem(BaseModel):
    headline: str
    source: str = ""
    date: Optional[str] = None
    relevance: str = ""
    searchQuery: str = ""

class Dataset(BaseModel):
    name: str
    description: str = ""
    source: str = ""           # Kaggle / UCI / HuggingFace / etc.
    format: str = ""
    size: Optional[str] = None
    howToFind: str = ""        # e.g. "Search 'LFW dataset' on kaggle.com"
    searchUrl: str = ""        # Autocomputed string

class Tool(BaseModel):
    name: str
    description: str = ""
    category: str = ""
    installation: str = ""
    officialSite: str = ""     # only for widely-known packages (numpy.org etc.)

class ResearchResponse(BaseModel):
    papers: List[Paper] = []
    articles: List[Article] = []
    news: List[NewsItem] = []
    datasets: List[Dataset] = []
    tools: List[Tool] = []
    summary: str = ""
    recommendations: List[str] = []
    disclaimer: str = "Links and DOIs are AI-generated knowledge. Always verify on Google Scholar, arXiv, or the tool's official site before citing."

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
    return {"agent": "Research", "status": "active", "version": "2.0.0"}

@app.post("/research", response_model=ResearchResponse)
async def conduct_research(request: ResearchRequest):
    """
    Conduct research: find papers, articles, news, datasets, and tools.
    Provides automated search links to verify the AI's findings.
    """
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert research AI agent for student academic projects.
Conduct comprehensive research on the given domain. Return ONLY valid JSON, no markdown.

IMPORTANT: Do NOT generate fake HTTP URLs for papers or articles. You cannot browse the internet so any specific link to a PDF you invent will be hallucinated.
Instead, strictly provide accurate `searchQuery` strings. The backend will automatically convert them to Google Scholar and ArXiv links.

The JSON MUST match this structure exactly:
{{
  "papers": [
    {{
      "title": "Exact paper title",
      "authors": ["Author Last, First", "Author 2"],
      "year": 2023,
      "abstract": "What this paper covers and proves...",
      "relevance": "Why this paper directly applies to the project",
      "venue": "Journal or Conference name (e.g. NeurIPS 2023, IEEE TPAMI)",
      "doi": "10.xxxx/xxxxx if you are confident, otherwise leave empty",
      "searchQuery": "exact title + first author to search on Google Scholar"
    }}
  ],
  "articles": [
    {{
      "title": "Article title",
      "source": "Medium / Towards Data Science / Analytics Vidhya / etc.",
      "summary": "What this article explains...",
      "publishedDate": "2024-03-01",
      "searchQuery": "title keywords to search on the source website"
    }}
  ],
  "news": [
    {{
      "headline": "News headline",
      "source": "TechCrunch / VentureBeat / etc.",
      "date": "2024-06-01",
      "relevance": "Why this news matters for the project",
      "searchQuery": "search terms to find this news"
    }}
  ],
  "datasets": [
    {{
      "name": "Dataset name",
      "description": "What it contains and why it is useful",
      "source": "Kaggle / UCI / HuggingFace / Google Dataset Search",
      "format": "CSV / JSON / Images / etc.",
      "size": "approximate size",
      "howToFind": "Search 'dataset name' on kaggle.com or huggingface.co/datasets"
    }}
  ],
  "tools": [
    {{
      "name": "Tool or library name",
      "description": "What it does and why it is relevant",
      "category": "library|framework|platform|service",
      "installation": "pip install tool-name  OR  npm install tool-name",
      "officialSite": "only include if you are 100% certain, e.g. numpy.org, tensorflow.org"
    }}
  ],
  "summary": "Comprehensive 200+ word overview of the state of the art in this domain...",
  "recommendations": ["Specific actionable advice 1", "Advice 2", "Advice 3"]
}}

RULES:
- 3-5 real, well-known research papers (not invented titles)
- 2-3 articles from known tech publications
- 2-3 recent relevant news items
- 2-3 useful datasets (real ones from Kaggle, UCI, HuggingFace, etc.)
- 3-5 tools/frameworks (real packages like PyTorch, scikit-learn, etc.)
- 200+ word summary
- Return raw JSON only, no extra text"""),
            ("user", """Domain: {domain}
Keywords: {keywords}

Conduct comprehensive research. Return ONLY JSON.""")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "domain": request.domain,
            "keywords": ", ".join(request.keywords) if request.keywords else "general"
        })
        
        try:
            result = parse_llm_json(response.content)
        except (json.JSONDecodeError, ValueError):
            result = {
                "papers": [{"title": f"Survey on {request.domain}", "authors": ["Various"], "year": 2024, "abstract": f"A comprehensive survey of {request.domain}", "relevance": "Foundational understanding", "venue": "IEEE", "doi": "", "searchQuery": f"survey {request.domain} site:scholar.google.com"}],
                "articles": [{"title": f"Getting Started with {request.domain}", "source": "Towards Data Science", "summary": f"Introduction to {request.domain} for beginners", "searchQuery": f"getting started {request.domain} site:towardsdatascience.com"}],
                "news": [{"headline": f"Latest developments in {request.domain}", "source": "TechCrunch", "relevance": "Current industry trends", "searchQuery": f"{request.domain} 2024 site:techcrunch.com"}],
                "datasets": [{"name": f"{request.domain} Dataset", "description": f"Standard dataset for {request.domain}", "source": "Kaggle", "format": "CSV", "howToFind": f"Search '{request.domain} dataset' on kaggle.com"}],
                "tools": [{"name": "Python", "description": "Primary programming language", "category": "language", "installation": "python.org/downloads", "officialSite": "python.org"}],
                "summary": f"Research overview for {request.domain}. Further investigation recommended.",
                "recommendations": ["Start with foundational papers", "Explore available datasets", "Choose appropriate tools"],
                "disclaimer": "Links and DOIs are AI-generated knowledge. Always verify on Google Scholar, arXiv, or the tool's official site before citing."
            }
            
        # --- Auto-compute Search URLs ---
        for paper in result.get("papers", []):
            sq = paper.get("searchQuery", "") or paper.get("title", "")
            if sq:
                encoded_sq = urllib.parse.quote_plus(sq)
                encoded_title = urllib.parse.quote_plus(paper.get("title", ""))
                paper["scholarUrl"] = f"https://scholar.google.com/scholar?q={encoded_sq}"
                paper["arxivUrl"] = f"https://arxiv.org/search/?query={encoded_title}&searchtype=all"
        
        for article in result.get("articles", []):
            sq = article.get("searchQuery", "") or article.get("title", "")
            if sq:
                encoded_sq = urllib.parse.quote_plus(sq)
                article["googleUrl"] = f"https://www.google.com/search?q={encoded_sq}"
                
        for dataset in result.get("datasets", []):
            ds = dataset.get("name", "")
            if ds:
                encoded_ds = urllib.parse.quote_plus(ds)
                if "kaggle" in dataset.get("source", "").lower() or "kaggle" in dataset.get("howToFind", "").lower():
                    dataset["searchUrl"] = f"https://www.kaggle.com/search?q={encoded_ds}"
                elif "huggingface" in dataset.get("source", "").lower() or "huggingface" in dataset.get("howToFind", "").lower():
                    dataset["searchUrl"] = f"https://huggingface.co/datasets?search={encoded_ds}"
                else:
                    dataset["searchUrl"] = f"https://datasetsearch.research.google.com/search?query={encoded_ds}"

        return ResearchResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Research agent error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Research error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
