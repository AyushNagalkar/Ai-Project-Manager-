import os
import re
import io
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Resume Parser OCR Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup check ──────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_check():
    print("\n[ResumeParser] ══ Startup check ══")
    try:
        import pymupdf
        print(f"[ResumeParser] ✓ pymupdf {pymupdf.__version__} ready")
    except ImportError:
        try:
            import fitz
            print(f"[ResumeParser] ✓ fitz (PyMuPDF) ready")
        except ImportError:
            print("[ResumeParser] ✗ PyMuPDF NOT installed — run: pip install PyMuPDF")
    try:
        import pdfplumber
        print(f"[ResumeParser] ✓ pdfplumber ready (fallback)")
    except ImportError:
        print("[ResumeParser]   pdfplumber not installed (optional fallback)")
    try:
        import multipart
        print(f"[ResumeParser] ✓ python-multipart ready")
    except ImportError:
        print("[ResumeParser] ✗ python-multipart NOT installed — run: pip install python-multipart")
    print("[ResumeParser] ══════════════════\n")

class ParsedResume(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    contact: Optional[str] = ""
    skills: List[str] = []
    education: Optional[str] = ""
    experience: Optional[str] = ""
    rawText: Optional[str] = ""

# Common technical skills to look for
SKILL_KEYWORDS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust", "swift",
    "kotlin", "php", "sql", "nosql", "mongodb", "mysql", "postgresql", "redis", "sqlite",
    "html", "css", "react", "angular", "vue", "next.js", "node.js", "express", "django",
    "flask", "fastapi", "spring", "laravel", "tailwind", "bootstrap",
    "machine learning", "deep learning", "ai", "nlp", "computer vision", "data science",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "matplotlib",
    "docker", "kubernetes", "aws", "azure", "gcp", "linux", "git", "github",
    "rest api", "graphql", "microservices", "devops", "ci/cd", "agile", "scrum",
    "figma", "photoshop", "ui/ux", "design", "wireframing",
    "power bi", "tableau", "excel", "word", "powerpoint",
    "blockchain", "iot", "embedded", "arduino", "raspberry pi",
    "android", "ios", "flutter", "react native",
    "communication", "leadership", "teamwork", "problem solving", "critical thinking",
    "project management", "time management", "research", "writing", "presentation"
]

def extract_email(text: str) -> str:
    """Extract email from text using regex."""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    match = re.search(email_pattern, text)
    return match.group(0) if match else ""

def extract_phone(text: str) -> str:
    """Extract phone number from text."""
    phone_patterns = [
        r'(?:\+91[\-\s]?)?[6-9]\d{9}',  # Indian mobile
        r'(?:\+1[\-\s]?)?\(?\d{3}\)?[\-\s]?\d{3}[\-\s]?\d{4}',  # US format
        r'\d{10,12}',  # Generic
    ]
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    return ""

def extract_name(text: str) -> str:
    """Extract name — typically the first non-empty line of a resume."""
    lines = text.strip().split('\n')
    for line in lines[:5]:
        line = line.strip()
        # Skip lines that look like headers, emails, phones, or URLs
        if line and len(line) > 1 and len(line) < 60:
            if not re.search(r'@|http|www|resume|curriculum|vitae|cv|\d{5,}', line, re.IGNORECASE):
                # Likely a name
                return line.title()
    return ""

def extract_skills(text: str) -> List[str]:
    """Extract skills by matching against known skill keywords."""
    text_lower = text.lower()
    found_skills = []
    
    for skill in SKILL_KEYWORDS:
        # Use word boundary matching
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill.title())
    
    return list(set(found_skills))

def extract_education(text: str) -> str:
    """Extract education section."""
    education_headers = [r'education', r'academic', r'qualification', r'degree']
    section_headers = [r'experience', r'skills', r'projects', r'work', r'certif', r'achiev', r'award', r'hobby', r'interest', r'reference']
    
    text_lines = text.split('\n')
    capturing = False
    education_lines = []
    
    for line in text_lines:
        line_lower = line.strip().lower()
        
        if any(re.search(header, line_lower) for header in education_headers):
            capturing = True
            continue
        
        if capturing:
            if any(re.search(header, line_lower) for header in section_headers):
                break
            if line.strip():
                education_lines.append(line.strip())
    
    return ' | '.join(education_lines[:5]) if education_lines else ""

def extract_experience(text: str) -> str:
    """Extract experience section."""
    experience_headers = [r'experience', r'work history', r'employment', r'internship']
    section_headers = [r'education', r'skills', r'projects', r'certif', r'achiev', r'award', r'hobby', r'interest', r'reference']
    
    text_lines = text.split('\n')
    capturing = False
    experience_lines = []
    
    for line in text_lines:
        line_lower = line.strip().lower()
        
        if any(re.search(header, line_lower) for header in experience_headers):
            capturing = True
            continue
        
        if capturing:
            if any(re.search(header, line_lower) for header in section_headers):
                break
            if line.strip():
                experience_lines.append(line.strip())
    
    return ' | '.join(experience_lines[:8]) if experience_lines else ""


@app.get("/")
async def root():
    return {"service": "Resume Parser", "status": "active", "version": "1.0.0"}

@app.post("/parse-resume", response_model=ParsedResume)
async def parse_resume(file: UploadFile = File(...)):
    print(f"[ResumeParser] ---- New request ----")
    print(f"[ResumeParser] filename={file.filename!r}  content_type={file.content_type!r}")

    filename = file.filename or ""
    if not filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = await file.read()
        print(f"[ResumeParser] Read {len(content)} bytes")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        text = ""
        pdf_parsed = False

        # --- PyMuPDF (preferred) ---
        print("[ResumeParser] Trying PyMuPDF...")
        try:
            try:
                import pymupdf as fitz
                print("[ResumeParser] Imported as pymupdf")
            except ImportError:
                import fitz
                print("[ResumeParser] Imported as fitz")

            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                text += page.get_text()
            doc.close()
            pdf_parsed = True
            print(f"[ResumeParser] PyMuPDF OK — extracted {len(text)} chars")
        except ImportError:
            print("[ResumeParser] PyMuPDF not installed, trying pdfplumber...")
        except Exception as e:
            print(f"[ResumeParser] PyMuPDF error: {e}")
            traceback.print_exc()

        # --- pdfplumber fallback ---
        if not pdf_parsed:
            print("[ResumeParser] Trying pdfplumber...")
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    for page in pdf.pages:
                        text += (page.extract_text() or "") + "\n"
                pdf_parsed = True
                print(f"[ResumeParser] pdfplumber OK — extracted {len(text)} chars")
            except ImportError:
                msg = "No PDF library installed. Run: pip install PyMuPDF"
                print(f"[ResumeParser] {msg}")
                raise HTTPException(status_code=500, detail=msg)
            except Exception as e:
                print(f"[ResumeParser] pdfplumber error: {e}")
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text. PDF may be image-based.")

        print("[ResumeParser] Extracting fields...")
        result = ParsedResume(
            name=extract_name(text),
            email=extract_email(text),
            contact=extract_phone(text),
            skills=extract_skills(text),
            education=extract_education(text),
            experience=extract_experience(text),
            rawText=text[:2000]  # First 2000 chars for reference
        )
        
        print(f"[ResumeParser] Done! name={result.name!r}  skills={result.skills}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ResumeParser] Unhandled error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
