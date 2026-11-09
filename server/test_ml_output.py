import sys
import os
import json
sys.path.append(os.path.abspath('d:/College/Sem4 Project/ml_engine'))
from src.analyzer import ResumeAnalyzer

test_text = """
M.AKASH F U L L S T A C K D E V E L E O P E R
CONTACT
+91 6238 324918
akashmanikandan21@gmail.com
S K I L L S
Frontend Development: React.js, Next.js, HTML, CSS
Backend Development: Python (Django, FastAPI), Node.js
Database: SQL, PostgreSQL
AI & ML: ML Algorithms, AI Tools & Prompting
Version Control and DevOps : Git, GitHub
Cloud & Deployment: Render, Vercel
"""

analyzer = ResumeAnalyzer()
result = analyzer.suggest_roles(test_text)
print(json.dumps(result, indent=2))
