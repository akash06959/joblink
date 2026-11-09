import torch  # type: ignore
import numpy as np  # type: ignore
import re
import os
import json
from sentence_transformers import SentenceTransformer  # type: ignore
from typing import List, Dict, Any, Tuple

# ─── Structured Technical Skills Dictionary ──────────────────────────────────
# Organized by domain. All lowercase. Role labels (frontend, backend) excluded.
# These are matched against resume and JD text to compute keyword overlap scores.
COMMON_SKILLS = [
    # ── Programming Languages ─────────────────────────────────────────────────
    "python", "java", "javascript", "typescript", "c++", "c#", "c", "go",
    "golang", "rust", "ruby", "php", "swift", "kotlin", "scala", "r",
    "matlab", "perl", "bash", "shell scripting", "powershell",

    # ── Web Frontend ──────────────────────────────────────────────────────────
    "html", "css", "html5", "css3", "react", "react.js", "angular", "vue",
    "vue.js", "next.js", "nuxt.js", "svelte", "jquery", "bootstrap",
    "tailwind css", "material ui", "sass", "less", "webpack", "vite",
    "redux", "zustand", "graphql", "apollo", "responsive design",

    # ── Web Backend ───────────────────────────────────────────────────────────
    "node.js", "express", "express.js", "django", "flask", "fastapi",
    "spring", "spring boot", "laravel", "rails", "ruby on rails",
    "asp.net", ".net", "rest api", "restful api", "graphql api",
    "microservices", "oops", "oop", "object oriented programming",
    "websockets", "grpc", "oauth", "jwt", "authentication",

    # ── Databases ─────────────────────────────────────────────────────────────
    "sql", "mysql", "postgresql", "sqlite", "mongodb", "redis",
    "cassandra", "dynamodb", "firebase", "supabase", "elasticsearch",
    "nosql", "orm", "sequelize", "mongoose", "prisma", "database design",
    "database administration", "data modeling", "etl",

    # ── Cloud & DevOps ────────────────────────────────────────────────────────
    "aws", "azure", "gcp", "google cloud", "heroku", "vercel", "netlify",
    "docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd",
    "github actions", "gitlab ci", "linux", "unix", "nginx", "apache",
    "cloud computing", "serverless", "lambda", "s3", "ec2", "cloudformation",

    # ── Machine Learning / AI ─────────────────────────────────────────────────
    "machine learning", "deep learning", "neural networks", "nlp",
    "natural language processing", "computer vision", "tensorflow",
    "pytorch", "keras", "scikit-learn", "sklearn", "xgboost", "pandas",
    "numpy", "matplotlib", "seaborn", "data analysis", "data science",
    "feature engineering", "model training", "model deployment",
    "transformers", "bert", "llm", "large language models", "opencv",
    "hugging face", "reinforcement learning", "statistics",

    # ── Mobile Development ────────────────────────────────────────────────────
    "android", "ios", "flutter", "react native", "swift", "kotlin",
    "xcode", "android studio", "mobile development",

    # ── Tools & Practices ─────────────────────────────────────────────────────
    "git", "github", "gitlab", "bitbucket", "jira", "agile", "scrum",
    "kanban", "unit testing", "integration testing", "test driven development",
    "tdd", "jest", "pytest", "selenium", "postman", "swagger",
    "figma", "design systems", "web sockets", "caching", "load balancing",

    # ── Data Engineering ──────────────────────────────────────────────────────
    "apache spark", "hadoop", "kafka", "airflow", "data pipeline",
    "data warehouse", "snowflake", "bigquery", "power bi", "tableau",
    "looker", "business intelligence",

    # ── Security ──────────────────────────────────────────────────────────────
    "cybersecurity", "network security", "penetration testing", "siem",
    "encryption", "ssl", "tls", "firewall", "vulnerability assessment",
]

JOB_ROLES = {
    "Software Developer": "Builds applications and systems using modern frameworks and programming languages.",
    "Data Analyst": "Analyses data using SQL, Python, and visualization tools to extract business insights.",
    "Machine Learning Engineer": "Designs and trains ML models using Python, TensorFlow, and PyTorch.",
    "DevOps Engineer": "Manages CI/CD pipelines, cloud infrastructure, Docker, and Kubernetes deployments.",
    "Full Stack Developer": "Develops both frontend (React/Angular) and backend (Node.js/Django) systems."
}

# ─── Curated Skill Map for Jobs in the System ───────────────────────────────
# Keyed by lowercase patterns matched against the inferred job title.
# Used as a supplement in analyze() so Matched/Missing always has real data.
JOB_SKILL_MAP_CURATED: Dict[str, List[str]] = {
    "full stack": [
        "react", "node.js", "mongodb", "rest api", "git",
        "express", "javascript", "html", "css", "postgresql",
        "typescript", "redux", "docker", "ci/cd", "authentication",
        "graphql", "jest", "agile", "sql",
    ],
    "backend": [
        "python", "django", "postgresql", "rest api", "flask",
        "fastapi", "docker", "redis", "jwt", "oauth", "sql",
        "mongodb", "git", "unit testing", "microservices", "aws", "linux", "nginx",
    ],
    "backend developer": [
        "python", "django", "postgresql", "rest api", "flask",
        "fastapi", "docker", "jwt", "sql", "mongodb", "git", "microservices",
    ],
    "frontend": [
        "react", "javascript", "css", "html", "typescript",
        "bootstrap", "tailwind css", "redux", "next.js",
        "responsive design", "webpack", "vite", "git", "jest", "figma", "sass",
    ],
    "frontend developer": [
        "react", "javascript", "css", "html", "typescript",
        "bootstrap", "responsive design", "redux", "git", "figma",
    ],
    "software engineer": [
        "java", "spring boot", "mysql", "html", "css",
        "rest api", "git", "oop", "unit testing", "agile",
        "sql", "javascript", "python", "docker", "jira", "microservices", "postgresql",
    ],
    "software developer": [
        "java", "python", "javascript", "spring boot", "mysql",
        "rest api", "git", "oop", "docker", "agile", "sql",
    ],
    "data analyst": [
        "python", "sql", "pandas", "numpy", "matplotlib",
        "power bi", "tableau", "statistics", "data analysis",
        "postgresql", "mysql", "machine learning",
    ],
    "machine learning": [
        "python", "machine learning", "tensorflow", "pytorch",
        "scikit-learn", "pandas", "numpy", "deep learning",
        "nlp", "computer vision", "statistics", "data analysis", "git", "docker",
    ],
    "machine learning engineer": [
        "python", "machine learning", "tensorflow", "pytorch",
        "scikit-learn", "pandas", "numpy", "deep learning", "git",
    ],
    "devops": [
        "docker", "kubernetes", "aws", "ci/cd", "jenkins",
        "terraform", "ansible", "linux", "git", "nginx", "python", "bash",
    ],
    "cloud": [
        "aws", "azure", "gcp", "docker", "kubernetes",
        "terraform", "serverless", "python", "ci/cd", "linux", "machine learning",
    ],
    "microsoft learn": [
        "cloud computing", "azure", "machine learning", "python",
        "leadership", "agile", "git", "rest api",
    ],
    "women techmakers": [
        "python", "javascript", "html", "css", "git", "agile", "leadership",
    ],
    "mentorship": [
        "communication", "leadership", "agile", "git",
        "python", "javascript", "html", "css",
    ],
}

# ─── Skill Tiers per Job — Core / Secondary / Bonus ─────────────────────────
# Core    (weight 1.0) — must-have: job is unviable without them
# Secondary (weight 0.6) — strongly preferred: docker, cloud, testing
# Bonus   (weight 0.2) — nice-to-have: methodologies, soft tools
JOB_SKILL_TIERS: Dict[str, Dict[str, List[str]]] = {
    "backend": {
        "core":      ["python", "django", "rest api", "postgresql", "sql", "authentication"],
        "secondary": ["docker", "aws", "redis", "jwt", "git", "linux", "microservices"],
        "bonus":     ["flask", "fastapi", "nginx", "oauth", "celery", "unit testing"],
    },
    "backend developer": {
        "core":      ["python", "django", "rest api", "postgresql", "sql"],
        "secondary": ["docker", "git", "jwt", "mongodb"],
        "bonus":     ["flask", "fastapi", "redis", "aws"],
    },
    "frontend": {
        "core":      ["react", "javascript", "html", "css"],
        "secondary": ["typescript", "git", "responsive design", "bootstrap"],
        "bonus":     ["redux", "next.js", "webpack", "jest", "figma", "sass"],
    },
    "frontend developer": {
        "core":      ["react", "javascript", "html", "css"],
        "secondary": ["typescript", "bootstrap", "git", "responsive design"],
        "bonus":     ["redux", "figma", "jest", "vite"],
    },
    "full stack": {
        "core":      ["react", "node.js", "javascript", "rest api", "mongodb", "git"],
        "secondary": ["typescript", "postgresql", "docker", "express"],
        "bonus":     ["redux", "graphql", "ci/cd", "jest", "agile"],
    },
    "software engineer": {
        "core":      ["java", "spring boot", "mysql", "rest api", "oop"],
        "secondary": ["git", "agile", "docker", "sql", "unit testing"],
        "bonus":     ["javascript", "html", "css", "jira", "microservices"],
    },
    "data analyst": {
        "core":      ["python", "sql", "pandas", "data analysis"],
        "secondary": ["power bi", "tableau", "postgresql", "statistics"],
        "bonus":     ["machine learning", "numpy", "matplotlib", "excel"],
    },
    "machine learning": {
        "core":      ["python", "machine learning", "scikit-learn", "pandas", "numpy"],
        "secondary": ["tensorflow", "pytorch", "deep learning", "git"],
        "bonus":     ["nlp", "computer vision", "docker", "fastapi", "statistics"],
    },
    "devops": {
        "core":      ["docker", "kubernetes", "ci/cd", "linux", "git"],
        "secondary": ["aws", "jenkins", "ansible", "terraform", "nginx"],
        "bonus":     ["python", "bash", "github actions", "monitoring"],
    },
    "cloud": {
        "core":      ["aws", "docker", "kubernetes", "python"],
        "secondary": ["terraform", "azure", "ci/cd", "linux"],
        "bonus":     ["gcp", "serverless", "monitoring", "bash"],
    },
}

# ─── Skill Alias Map — for partial credit on equivalent skills ───────────────
# If a job requires skill A but resume has skill B (an alias), award 0.7 credit.
SKILL_ALIASES: Dict[str, List[str]] = {
    # Python web frameworks (interchangeable for most roles)
    "django":      ["flask", "fastapi"],
    "flask":       ["django", "fastapi"],
    "fastapi":     ["flask", "django"],
    # JavaScript frameworks
    "react":       ["angular", "vue", "next.js", "svelte"],
    "angular":     ["react", "vue"],
    "vue":         ["react", "angular"],
    # SQL databases
    "postgresql":  ["mysql", "sqlite", "sql server"],
    "mysql":       ["postgresql", "sqlite", "sql server"],
    # NoSQL
    "mongodb":     ["cassandra", "couchdb", "dynamodb"],
    # Cloud providers
    "aws":         ["azure", "gcp"],
    "azure":       ["aws", "gcp"],
    "gcp":         ["aws", "azure"],
    # ML frameworks
    "tensorflow":  ["pytorch", "keras"],
    "pytorch":     ["tensorflow", "keras"],
    # Node.js runtime
    "node.js":     ["express", "nestjs"],
    "express":     ["node.js", "fastapi", "flask"],
    # Java backend
    "spring boot": ["java", "spring"],
    # Container / deployment
    "docker":      ["podman", "kubernetes"],
    "kubernetes":  ["docker", "docker compose"],
}

# ─── Domain boosting rules ────────────────────────────────────────────────────
DOMAIN_BOOST_RULES = [
    # (set of keywords that must appear, roles to boost, boost amount)
    ({"python", "tensorflow", "pytorch", "machine learning", "deep learning"},
        ["machine learning engineer", "data scientist", "ai engineer", "ml engineer"], 0.12),
    ({"python", "sql", "data", "pandas", "tableau", "power bi"},
        ["data analyst", "business analyst", "data engineer", "business intelligence analyst"], 0.10),
    ({"docker", "kubernetes", "ci/cd", "jenkins", "aws", "azure", "terraform", "ansible"},
        ["devops engineer", "cloud engineer", "site reliability engineer", "platform engineer"], 0.12),
    ({"react", "angular", "vue", "html", "css", "javascript", "typescript", "frontend"},
        ["frontend developer", "web developer", "ui developer", "web designer"], 0.10),
    ({"node.js", "express", "django", "flask", "spring", "backend", "rest api", "microservices"},
        ["backend developer", "software engineer", "api developer", "java developer"], 0.10),
    ({"react", "node.js", "full stack", "mongodb", "postgresql"},
        ["full stack developer", "mern developer", "software developer"], 0.11),
    ({"android", "ios", "swift", "kotlin", "flutter", "react native"},
        ["mobile developer", "android developer", "ios developer", "app developer"], 0.12),
    ({"cybersecurity", "penetration testing", "network security", "firewall", "siem"},
        ["security engineer", "cybersecurity analyst", "information security analyst"], 0.12),
    ({"r", "sas", "spss", "statistics", "hypothesis testing", "regression"},
        ["data scientist", "statistician", "research analyst"], 0.09),
]

# ─── Role-extraction keywords (signal that a candidate IS a tech professional) ─
ROLE_TITLE_KEYWORDS = [
    "full stack", "frontend", "backend", "software engineer", "software developer",
    "web developer", "data analyst", "data scientist", "machine learning engineer",
    "devops", "cloud engineer", "mobile developer", "android developer",
    "ios developer", "ui developer", "api developer", "python developer",
    "java developer", "mern", "mean", "react developer", "node developer",
    "qa engineer", "database administrator", "network engineer", "security analyst",
    "system analyst", "it manager", "product manager", "scrum master",
]

# ─── Roles to penalize when the resume is clearly an IT / Software profile ─────
NON_IT_PENALTY_ROLES = [
    "agricultural", "agriculture", "farmer", "soil", "crop", "forestry",
    "veterinarian", "fishery", "horticulture", "agronomy", "livestock",
    "food processing", "groundskeeper", "landscape",
]


class ResumeAnalyzer:
    """
    AI-powered ATS Engine implementing:
    1. Full job description embeddings (not bare titles)
    2. Structured ESCO job-to-skill mapping
    3. Hybrid scoring: 60% Semantic + 30% Skill overlap + 10% Domain boost
    4. Proper score calibration (no artificial clipping)
    5. Domain-aware boosting for explainable results
    """

    def __init__(self):
        print("Loading NLP models...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer("all-MiniLM-L6-v2", device=self.device)
        print(f"Models loaded on {self.device}.")

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        # ── 1. Load skill dictionary ──────────────────────────────────────────
        # We intentionally DO NOT load refined_skills.json (O*NET dataset) because
        # it contains thousands of short garbage fragments ('ic', 'io', 'ng', 'ssis',
        # 'cti', 'did') that cause false positive skill extractions when matched
        # against resume/JD text using substring search.
        # Our curated COMMON_SKILLS list is clean, domain-specific, and sufficient.
        self.common_skills: set = set([s.lower().strip() for s in COMMON_SKILLS if len(s.strip()) >= 2])
        print(f"Using curated skill dictionary: {len(self.common_skills):,} skills.")

        # ── 2. Load job_roles (descriptions) ─────────────────────────────────
        self.job_roles: Dict[str, str] = JOB_ROLES
        try:
            jobs_path = os.path.join(base_dir, "processed", "refined_jobs.json")
            if os.path.exists(jobs_path):
                with open(jobs_path, "r", encoding="utf-8") as f:
                    self.job_roles = json.load(f)
                print(f"Loaded {len(self.job_roles):,} job roles with full descriptions.")
        except Exception as e:
            print(f"Fallback job roles used. Error: {e}")

        # ── 3. Load ESCO job→skill mapping & align keys to our job_roles ────────
        # NOTE: self.job_role_names must be set BEFORE this block.
        self.job_role_names: List[str] = list(self.job_roles.keys())
        self.job_skill_map: Dict[str, List[str]] = {}
        try:
            skill_map_path = os.path.join(base_dir, "processed", "job_skill_map.json")
            if os.path.exists(skill_map_path):
                with open(skill_map_path, "r", encoding="utf-8") as f:
                    raw_map: Dict[str, List[str]] = json.load(f)

                # Build lowercase lookup for fast fuzzy alignment
                raw_lower: Dict[str, List[str]] = {
                    k.lower().strip(): v for k, v in raw_map.items()
                }

                # For each of our job_roles, try to find the best matching ESCO key
                aligned: int = 0
                for role_title in self.job_role_names:
                    role_lower = role_title.lower().strip()
                    if role_lower in raw_lower:
                        self.job_skill_map[role_title] = raw_lower[role_lower]
                        aligned += 1
                    else:
                        # Partial-match: find the best ESCO occupation that contains
                        # the same key words as our role title
                        words = set(role_lower.replace(",", "").split())
                        best_key: str = ""
                        best_overlap: int = 0
                        for esco_key in raw_lower:
                            esco_words = set(esco_key.replace(",", "").split())
                            ov = len(words & esco_words)
                            if ov > best_overlap and ov >= 2:
                                best_overlap = ov
                                best_key = esco_key
                        if best_key:
                            self.job_skill_map[role_title] = raw_lower[best_key]  # type: ignore[index]
                            aligned += 1

                print(f"Skill map aligned for {aligned:,} / {len(self.job_role_names):,} roles.")
        except Exception as e:
            print(f"Job skill map not loaded. Error: {e}")

        # ── 4. Pre-compute job embedding matrix ───────────────────────────────
        print("Pre-computing job embedding matrix (ensures <100ms latency per request)...")

        # IMPROVEMENT 1: Encode full descriptions, not bare titles
        # This makes embeddings far more contextually rich
        job_texts = [
            f"{role}: {desc}"
            for role, desc in self.job_roles.items()
        ]
        self.job_embeddings = self.model.encode(job_texts, show_progress_bar=False)  # type: ignore
        # L2-normalize for fast dot-product cosine similarity
        norms = np.linalg.norm(self.job_embeddings, axis=1, keepdims=True)
        self.job_embeddings = self.job_embeddings / np.maximum(norms, 1e-10)
        print("Initialization complete. ML Engine ready.")

    # ─── Skill Extraction ────────────────────────────────────────────────────
    def extract_skills(self, text: str) -> List[str]:
        """N-gram set intersection for O(1) skill matching against 100k+ skill dictionary."""
        text_normalized = re.sub(r"[^a-z0-9 .#+]", " ", text.lower())
        words = text_normalized.split()
        n = len(words)

        # Build 1–4 gram set from text
        ngrams: set = set(words)
        for size in range(2, 5):
            for i in range(n - size + 1):
                ngrams.add(" ".join(words[i: i + size]))  # type: ignore

        found: set = set()
        for skill in self.common_skills:
            if skill in ngrams:
                found.add(skill)

        return list(found)

    # ─── Weighted Resume Text Builder ────────────────────────────────────────
    def _build_weighted_resume_text(self, resume_text: str) -> str:
        """
        Fixes the domain-vs-profession confusion problem.

        PROBLEM: Passing raw resume text to BERT gives equal weight to:
          - Project descriptions ("built agricultural monitoring system")
          - Job titles ("Full Stack Developer")
          - Skills ("React, Node.js, FastAPI")

        SOLUTION: Extract sections and apply weights:
          - Profile Summary / Objective  → ×3 (candidate describes themselves)
          - Skills section               → ×4 (the strongest role signal)
          - Job Titles / Experience      → ×3 (what they have been hired as)
          - Projects                     → ×1 (domain context, lower weight)
          - Education                    → ×1 (neutral)
        """
        text = resume_text.strip()
        lines = text.split('\n')

        sections: Dict[str, List[str]] = {
            "summary":    [],
            "skills":     [],
            "experience": [],
            "projects":   [],
            "other":      [],
        }

        SUMMARY_HEADERS    = {"summary", "objective", "profile", "about", "about me"}
        SKILLS_HEADERS     = {"skills", "technical skills", "core competencies", "technologies", "tech stack"}
        EXPERIENCE_HEADERS = {"experience", "work experience", "employment", "career", "internship", "internships"}
        PROJECT_HEADERS    = {"projects", "project", "personal projects", "academic projects", "key projects"}

        current_section = "other"
        for line in lines:
            stripped = line.strip()
            lower = stripped.lower().rstrip(':')
            if lower in SUMMARY_HEADERS:
                current_section = "summary"
                continue
            elif lower in SKILLS_HEADERS:
                current_section = "skills"
                continue
            elif lower in EXPERIENCE_HEADERS:
                current_section = "experience"
                continue
            elif lower in PROJECT_HEADERS:
                current_section = "projects"
                continue
            elif stripped:
                sections[current_section].append(stripped)

        # Fallback: if no sections were detected (unformatted resume), use the
        # first 20% of text as proxy for summary and whole text for the rest.
        if all(len(v) == 0 for v in sections.values()):
            total_lines = len(lines)
            summary_end = max(3, total_lines // 5)
            sections["summary"] = list(lines[:summary_end])
            sections["other"]   = list(lines[summary_end:])

        # Weights: skills and summary carry most role-definitional power
        WEIGHTS = {"summary": 3, "skills": 4, "experience": 3, "projects": 1, "other": 1}

        parts: List[str] = []
        for section, weight in WEIGHTS.items():
            content = " ".join(sections[section]).strip()
            if content:
                # Repeat the content according to its weight so BERT's attention
                # is proportionally drawn to high-signal sections
                parts.extend([content] * weight)

        return " ".join(parts) if parts else resume_text

    # ─── Cosine Similarity ───────────────────────────────────────────────────
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Cosine similarity between two texts via SBERT embeddings."""
        embs = self.model.encode([text1, text2])
        e1, e2 = embs[0], embs[1]
        sim = float(
            np.dot(e1, e2) / (np.linalg.norm(e1) * np.linalg.norm(e2) + 1e-10)
        )
        return max(0.0, min(1.0, sim))

    # ─── Domain Boost ────────────────────────────────────────────────────────
    def _domain_boost(self, resume_skills: set, role_name: str) -> float:
        """
        IMPROVEMENT 5: Domain-aware boosting.
        Adds score bonus when resume skills strongly indicate a specific domain.
        e.g. Python + TensorFlow + PyTorch → boosts ML Engineer roles.
        """
        role_lower = role_name.lower()
        boost = 0.0
        for keyword_set, target_roles, amount in DOMAIN_BOOST_RULES:
            overlap = len(keyword_set & resume_skills)
            if overlap >= 2:  # At least 2 domain keywords must match
                for target in target_roles:
                    if target in role_lower:
                        # Partial match bonus — more keywords = stronger boost
                        boost = max(boost, amount * (overlap / len(keyword_set)))
        return boost

    # ─── Match Level & Confidence ────────────────────────────────────────────
    def get_match_level(self, score: float) -> str:
        if score >= 80: return "🔥 Excellent Match"
        elif score >= 65: return "✅ Strong Match"
        elif score >= 50: return "⚠ Moderate Match"
        elif score >= 35: return "❌ Weak Match"
        else: return "🚫 Not Recommended"

    def get_confidence_level(self, score: float) -> str:
        if score >= 75: return "High"
        elif score >= 55: return "Medium"
        else: return "Low"

    # ─── Role Suggestion ─────────────────────────────────────────────────────
    def suggest_roles(self, resume_text: str) -> Dict[str, Any]:
        """
        Hybrid zero-shot job classification:
        - 60% Semantic similarity (SBERT cosine)
        - 30% Skill overlap score (ESCO job→skill mapping)
        - 10% Domain boost (rule-based keyword amplification)
        """
        resume_lower = resume_text.lower()
        resume_skills_raw = set(self.extract_skills(resume_text))

        # ── ROLE AWARENESS FIX ──────────────────────────────────────────────
        # Build a weighted version of the resume that up-weights skills &
        # summary and down-weights project domain descriptions.
        weighted_resume = self._build_weighted_resume_text(resume_text)

        # Detect if resume has clear IT/software role signals
        is_it_professional = any(kw in resume_lower for kw in ROLE_TITLE_KEYWORDS)

        # Encode the WEIGHTED resume (role-aware) instead of raw text
        resume_emb = self.model.encode([weighted_resume])[0]  # type: ignore
        resume_emb = resume_emb / (np.linalg.norm(resume_emb) + 1e-10)

        # IMPROVEMENT 1: Semantic scores via pre-computed full-description embeddings
        semantic_sims = np.dot(self.job_embeddings, resume_emb)  # shape: (N,)

        scored: List[Tuple[str, float, float, float, float]] = []

        # ── CALIBRATION: Two-pass min-max rescaling ─────────────────────────
        # SBERT all-MiniLM cosine sims for IT resumes vs IT job descriptions
        # naturally cluster in the 0.20–0.60 range.  Mapping this linearly to
        # percent gives 20–60%, which feels wrong even for a perfect match.
        #
        # Fix: collect all raw sims, find the actual min/max in this batch,
        # then rescale to [SCORE_FLOOR, SCORE_CEIL] so the best role always
        # scores high and the worst scores low — relative to each other.
        SCORE_FLOOR = 20.0   # lowest possible calibrated semantic score
        SCORE_CEIL  = 95.0   # highest possible calibrated semantic score

        raw_sims = [float(semantic_sims[i]) for i in range(len(self.job_role_names))]
        sim_min = min(raw_sims)
        sim_max = max(raw_sims)
        sim_range = sim_max - sim_min if sim_max > sim_min else 1e-6

        for i, role in enumerate(self.job_role_names):
            raw_sim = raw_sims[i]

            # Min-max rescale into [SCORE_FLOOR, SCORE_CEIL]
            normalized = (raw_sim - sim_min) / sim_range          # 0.0 – 1.0
            semantic_score = SCORE_FLOOR + normalized * (SCORE_CEIL - SCORE_FLOOR)

            # IMPROVEMENT 2: Skill overlap score from ESCO job→skill map
            skill_score = 0.0
            role_required_skills = self.job_skill_map.get(role, [])
            if role_required_skills:
                matched = len(set(role_required_skills) & resume_skills_raw)
                skill_score = (matched / len(role_required_skills)) * 100.0

            # IMPROVEMENT 5: Domain boost
            domain_bonus = self._domain_boost(resume_skills_raw, role) * 100.0

            # IMPROVEMENT 3: Hybrid scoring formula
            # 50% semantic + 35% skill overlap + 15% domain boost
            if role_required_skills:
                hybrid = 0.50 * semantic_score + 0.35 * skill_score + 0.15 * domain_bonus
            else:
                # No skill map for this role: fall back to 85% semantic + 15% domain
                hybrid = 0.85 * semantic_score + 0.15 * domain_bonus

            # Title-match bonus
            role_lower = role.lower()
            if role_lower in resume_lower:
                hybrid = min(100.0, hybrid + 12.0)
            elif role_lower.replace(" ", "-") in resume_lower:
                hybrid = min(100.0, hybrid + 9.0)
            elif role_lower.replace("developer", "development") in resume_lower:
                hybrid = min(100.0, hybrid + 6.0)
            elif role_lower.replace("engineer", "engineering") in resume_lower:
                hybrid = min(100.0, hybrid + 6.0)

            # NON-IT suppression
            if is_it_professional:
                if any(term in role_lower for term in NON_IT_PENALTY_ROLES):
                    hybrid = max(0.0, hybrid - 50.0)

            final_score = round(float(max(0.0, min(100.0, hybrid))), 1)
            scored.append((role.title(), final_score, semantic_score, skill_score, domain_bonus))

        # Sort by hybrid score
        scored.sort(key=lambda x: x[1], reverse=True)


        # Build top-5 output
        top_5: List[Dict[str, Any]] = []
        top_scored: List[Tuple[str, float, float, float, float]] = list(scored)[:5]  # type: ignore[index]
        for role, score, sem, skl, dom in top_scored:
            top_5.append({
                "role": str(role),
                "fit_score": float(score),
                "semantic_score": round(float(sem), 1),  # type: ignore[arg-type]
                "skill_score": round(float(skl), 1),  # type: ignore[arg-type]
                "domain_boost": round(float(dom), 1),  # type: ignore[arg-type]
                "confidence": str(self.get_confidence_level(float(score)))
            })

        primary = top_5[0] if top_5 else None
        secondary = top_5[1] if len(top_5) > 1 else None
        weakest_in_top5 = top_5[-1] if top_5 else None

        if primary:
            advice = f"You are strongest for **{primary['role']}** roles."
            if secondary:
                advice += f" You are also a strong candidate for **{secondary['role']}** positions."
            if weakest_in_top5 and float(weakest_in_top5["fit_score"]) < 55:
                advice += (
                    f" To target **{weakest_in_top5['role']}** roles, you should build up "
                    f"the core skills specifically required for that domain."
                )
        else:
            advice = "Please provide a more detailed resume for accurate recommendations."

        return {
            "recommended_roles": top_5,
            "primary_domain": primary["role"] if primary else "",
            "secondary_domain": secondary["role"] if secondary else "",
            "career_advice": advice,
            "roles": [r["role"] for r in top_5]
        }

    # ─── Word-Boundary Skill Extractor ──────────────────────────────────────────
    def _extract_skills_by_substring(self, text: str) -> List[str]:
        """
        Extracts skills using ONLY word-boundary-aware matching.

        Rules:
        - Purely alphanumeric skills (python, react, git, aws): use \b word
          boundaries so 'git' never matches inside 'digital', 'go' never
          matches inside 'going' or 'designing'.
        - Multi-word skills (rest api, spring boot): \b on both ends.
        - Special-char skills (node.js, c++, c#, ci/cd, asp.net): simple
          substring match — special chars make them specific enough.
        - Skip any skill shorter than 2 characters.
        """
        text_lower = text.lower()
        found: List[str] = []
        for skill in self.common_skills:
            skill_l = skill.lower().strip()
            if not skill_l or len(skill_l) < 2:
                continue

            # Determine if skill is purely alphanumeric (+ spaces for multi-word)
            is_plain = bool(re.match(r'^[a-z0-9 ]+$', skill_l))

            if is_plain:
                # Use strict word-boundary regex
                # \b prevents 'go' matching 'going', 'git' matching 'digital'
                pattern = r'\b' + re.escape(skill_l) + r'\b'
                if re.search(pattern, text_lower):
                    found.append(skill_l)
            else:
                # Special chars (node.js, c++, c#, ci/cd, scikit-learn)
                # Simple contains is fine — special chars prevent false positives
                if skill_l in text_lower:
                    found.append(skill_l)
        return found

    # ─── Main Analysis ────────────────────────────────────────────────────────
    def analyze(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Full ATS report implementing the 8-step fix plan:
        1. Role tags separated from technical skills
        2. Proper substring-based skill extraction
        3. Realistic ATS match formula (matched / job_skills)
        4. Contextual score from SBERT (different from ATS)
        5. Always-populated matched + missing skills
        6. Score capped at 92% for realism
        7. Skill supplement from curated job map
        8. Clear, human-readable output
        """
        # ── Step 1: Infer job title from JD ──────────────────────────────────
        inferred = self.suggest_roles(job_description)
        inferred_title = (
            inferred["recommended_roles"][0]["role"]
            if inferred["recommended_roles"]
            else "Unknown Role"
        )
        title_lower = inferred_title.lower()
        jd_lower = job_description.lower()

        # ── Step 2: Extract technical skills (word-boundary search) ──────────
        resume_skills_list = self._extract_skills_by_substring(resume_text)
        jd_skills_from_text = self._extract_skills_by_substring(job_description)
        resume_skills_set = set(resume_skills_list)

        # ── Step 3: Build tiered job skill sets ───────────────────────────────
        # Look up Core / Secondary / Bonus tiers for this job type.
        # Fall back to flat curated list when no tier definition exists.
        tier_match_key = ""
        for pattern in JOB_SKILL_TIERS:
            if pattern in title_lower or pattern in jd_lower:
                tier_match_key = pattern
                break

        if tier_match_key:
            tiers = JOB_SKILL_TIERS[tier_match_key]
            core_skills    = set(tiers.get("core",      []))
            secondary      = set(tiers.get("secondary", []))
            bonus_skills   = set(tiers.get("bonus",     []))
            job_skills_set = core_skills | secondary | bonus_skills
            print(f"[DEBUG] Using tier map for: '{tier_match_key}'")
        else:
            # Fallback: flat curated map (no tiers)
            curated: set = set()
            for pattern, curated_skills in JOB_SKILL_MAP_CURATED.items():
                if pattern in title_lower or pattern in jd_lower:
                    curated.update([s.lower().strip() for s in curated_skills])
                    break
            core_skills    = curated | set(jd_skills_from_text)
            secondary      = set()
            bonus_skills   = set()
            job_skills_set = core_skills

        # Also add anything explicitly found in the JD text
        job_skills_set.update(set(jd_skills_from_text))

        print(f"[DEBUG] Resume skills : {sorted(resume_skills_set)}")
        print(f"[DEBUG] Core required : {sorted(core_skills)}")
        print(f"[DEBUG] Secondary     : {sorted(secondary)}")

        # ── Step 4: Exact matches ─────────────────────────────────────────────
        matched_skills: List[str] = sorted(job_skills_set & resume_skills_set)
        raw_missing:    List[str] = sorted(job_skills_set - resume_skills_set)

        # ── Step 4b: Alias / substitution partial matches ─────────────────────
        # Award 0.7 credit for equivalent skills (FastAPI when job needs Flask etc.)
        alias_credit = 0.0
        alias_notes: List[str] = []
        for missing_skill in list(raw_missing):
            aliases = SKILL_ALIASES.get(missing_skill, [])
            for alias in aliases:
                if alias in resume_skills_set:
                    alias_credit += 0.7
                    alias_notes.append(f"{alias} ≈ {missing_skill}")
                    break   # only count once per missing skill

        # Never let Missing Skills be empty if job set is non-trivial
        if not raw_missing and job_skills_set:
            raw_missing = sorted((core_skills | secondary) - resume_skills_set)[:5]
        missing_skills = raw_missing[:8]    # cap to 8 for display
        matched_skills = matched_skills[:10]

        # ── Step 5: Tiered ATS Score ──────────────────────────────────────────
        # Core skills (must-have) → weight 1.0
        # Secondary skills        → weight 0.6
        # Bonus skills            → weight 0.2
        def _tier_ratio(tier: set, resume: set) -> float:
            if not tier: return 1.0  # no requirement → full credit
            exact = len(tier & resume)
            # partial alias credit capped within this tier
            aliases_in_tier = sum(
                0.7 for s in tier
                if s not in resume and any(a in resume for a in SKILL_ALIASES.get(s, []))
            )
            return min(1.0, (exact + aliases_in_tier) / len(tier))

        core_ratio      = _tier_ratio(core_skills, resume_skills_set)
        secondary_ratio = _tier_ratio(secondary,    resume_skills_set)
        bonus_ratio     = _tier_ratio(bonus_skills,  resume_skills_set)

        # Weighted keyword score from tiers
        keyword_score = (
            0.55 * core_ratio +
            0.30 * secondary_ratio +
            0.15 * bonus_ratio
        ) * 100.0

        print(f"[DEBUG] Core={core_ratio:.2f} | Sec={secondary_ratio:.2f} | Bonus={bonus_ratio:.2f} | KW={keyword_score:.1f}%")

        # ── Step 6: Contextual Score — SBERT (different from keyword score) ───
        raw_sim = self.calculate_similarity(resume_text, job_description)
        clamped_sim    = max(0.20, min(raw_sim, 0.65))
        normalized_sim = (clamped_sim - 0.20) / 0.45
        semantic_score = round(20.0 + (normalized_sim * 65.0), 1)   # → 20–85%

        # ── Step 7: Domain boost (small intelligent lift) ─────────────────────
        domain_bonus = self._domain_boost(resume_skills_set, inferred_title) * 100.0

        # ── Step 8: Final hybrid score ────────────────────────────────────────
        # Formula: 50% semantic + 30% core keyword + 15% secondary + 5% bonus + 5% domain
        final_score = (
            0.50 * semantic_score +
            0.30 * (core_ratio      * 100.0) +
            0.15 * (secondary_ratio * 100.0) +
            0.05 * (bonus_ratio     * 100.0) +
            0.05 * domain_bonus
        )
        # Cap at 92% — real ATS systems never award 100%
        final_score    = max(0.0, min(92.0, final_score))
        keyword_score  = max(0.0, min(92.0, keyword_score))
        semantic_score = max(0.0, min(92.0, semantic_score))

        print(f"[DEBUG] Semantic={semantic_score:.1f}% | KW={keyword_score:.1f}% | Final={final_score:.1f}%")
        if alias_notes:
            print(f"[DEBUG] Alias credit: {alias_notes}")

        # ── Step 9: Human-readable recommendation (Recruiter Facing) ────────────────────────────
        suggestions: List[str] = []
        if final_score >= 80:
            suggestions.append("This candidate is an excellent match for this role.")
        elif final_score >= 60:
            suggestions.append("This candidate is a strong match for this role.")
        elif final_score >= 40:
            suggestions.append("This candidate is a moderate match and may require further screening.")
        else:
            suggestions.append("This candidate's profile does not closely match the core technical requirements for this role.")

        if alias_notes:
            suggestions.append(
                f"They have related/transferable skills: {', '.join(alias_notes[:2])}."
            )
        if missing_skills:
            top_3 = [s for s in missing_skills if s in core_skills][:3] or missing_skills[:3]
            suggestions.append(
                f"They are missing some requested skills, including: {', '.join(s.title() for s in top_3)}."
            )
        if core_ratio < 0.4 and core_skills:
            suggestions.append(
                "They lack several core required skills for this position."
            )
        if semantic_score < 35:
            suggestions.append(
                "Domain mismatch: The context of their past experience does not align well with this job's requirements."
            )

        recommendation = " ".join(suggestions)

        # ── Suggest top roles for the resume ─────────────────────────────────
        resume_role_result = self.suggest_roles(resume_text)

        return {
            "job_title":           inferred_title,
            "overall_match_score": round(float(final_score), 1),
            "semantic_score":      round(float(semantic_score), 1),
            "keyword_score":       round(float(keyword_score), 1),
            "match_level":         self.get_match_level(final_score),
            "matched_skills":      matched_skills,
            "missing_skills":      missing_skills,
            "recommendation":      recommendation,
            "recommended_roles":   resume_role_result.get("recommended_roles", []),
            # Backwards compat keys
            "ats_match_score":          round(float(final_score), 1),
            "improvement_suggestions":  [recommendation],
        }

