import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.analyzer import ResumeAnalyzer  # noqa: E402

a = ResumeAnalyzer()

resume_skills_raw: set = set(a.extract_skills("Python JavaScript React Node.js PostgreSQL Docker REST API Git machine learning tensorflow"))
skills_sorted: list = sorted(list(resume_skills_raw))
print("Extracted resume skills:", skills_sorted[:20])  # type: ignore[index]

# Check what ESCO has for "Web Developers"
web_dev_skills: list = list(a.job_skill_map.get("Web Developers", []))
print("\nWeb Developers required skills (sample):", web_dev_skills[:20])  # type: ignore[index]

# Check overlap
overlap = set(web_dev_skills) & resume_skills_raw
print("\nOverlap:", overlap)

# Also check "Software Developers"
sf_dev_skills: list = list(a.job_skill_map.get("Software Developers", []))
print("\nSoftware Developers required skills (sample):", sf_dev_skills[:20])  # type: ignore[index]

overlap2 = set(sf_dev_skills) & resume_skills_raw
print("\nOverlap with Software Developers:", overlap2)

# What keys are in map that relate to developers?
dev_keys: list = [k for k in a.job_skill_map.keys() if "developer" in k.lower() or "software" in k.lower()]
print("\nDeveloper-related keys in skill map:", dev_keys[:10])  # type: ignore[index]
