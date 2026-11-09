from fastapi import FastAPI, File, UploadFile, Form, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel  # type: ignore
import fitz  # type: ignore # PyMuPDF
import io
import uvicorn  # type: ignore
from src.analyzer import ResumeAnalyzer  # type: ignore

class AnalyzeTextRequest(BaseModel):
    resume_text: str
    job_description: str

class SuggestRolesRequest(BaseModel):
    resume_text: str

app = FastAPI(title="JobLink ML Analyzer API", description="AI Semantic & Keyword Matcher")

# CORS setup so the Node.js backend or Frontend can reach this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize deep learning models once on boot
print("Starting up Analyzer Engine...")
analyzer = ResumeAnalyzer()

def extract_text_from_pdf(pdf_bytes):
    """Pulls text perfectly cleanly from a PDF using PyMuPDF."""
    try:
        doc = fitz.open("pdf", pdf_bytes)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        raise ValueError(f"Could not parse PDF: {str(e)}")

@app.post("/api/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Main endpoint. Requires:
    - resume: A PDF file upload
    - job_description: Form data text of the job
    """
    if not resume.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # 1. Read the PDF File
        pdf_bytes = await resume.read()
        resume_text = extract_text_from_pdf(pdf_bytes)
        
        if len(resume_text.strip()) < 20: 
            raise HTTPException(status_code=400, detail="Could not extract enough text from the PDF. It might be a scanned image.")
            
        # 2. Run the Neural Network Analysis & keyword matching
        print(f"Analyzing {resume.filename}...")
        result = analyzer.analyze(resume_text, job_description)
        
        # 3. Return the JSON ATS Report
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-text")
async def analyze_resume_text(request: AnalyzeTextRequest):
    """
    Endpoint that accepts raw text instead of a PDF file.
    """
    try:
        if len(request.resume_text.strip()) < 20: 
            raise HTTPException(status_code=400, detail="Not enough resume text provided.")
            
        print("Analyzing resume text directly...")
        result = analyzer.analyze(request.resume_text, request.job_description)
        
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/suggest-roles")
async def suggest_roles_endpoint(request: SuggestRolesRequest):
    """
    Endpoint that accepts raw text and suggests top 5 job roles.
    """
    try:
        if len(request.resume_text.strip()) < 20: 
            return {
                "recommended_roles": [{"role": "Software Developer", "fit_score": 0.0, "confidence": "Low"}],
                "primary_domain": "Software Developer",
                "secondary_domain": "",
                "weak_domain": "",
                "career_advice": "Please provide more valid text.",
                "roles": ["Software Developer"]
            }
            
        print("Suggesting roles for resume...")
        result = analyzer.suggest_roles(request.resume_text)
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "JobLink ML Engine is running stably! You can hit /api/analyze"}

if __name__ == "__main__":
    # reload=False prevents SBERT from loading twice (once in reloader parent,
    # again in the subprocess worker) which was causing KeyboardInterrupt crashes
    # and doubling the boot time. For development, restart manually after changes.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
