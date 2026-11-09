import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.analyzer import ResumeAnalyzer  # noqa: E402
import json  # noqa: E402

print("Starting...")
a = ResumeAnalyzer()

resume = (
    "John Smith - Full Stack Developer. "
    "Skills: Python, JavaScript, React, Node.js, PostgreSQL, Docker, REST API, Git. "
    "Experience: 3 years building web applications with React frontend and Node.js Express backend. "
    "Deployed containerized microservices using Docker and AWS EC2. "
    "Built REST APIs consumed by mobile apps. "
    "Education: BTech Computer Science."
)

result = a.suggest_roles(resume)

output_lines = []
output_lines.append("=== TOP 5 RECOMMENDED ROLES (Hybrid Scoring) ===")
for r in result["recommended_roles"]:
    line = (
        r["role"] + ": " + str(r["fit_score"]) + "% "
        + "(semantic=" + str(r["semantic_score"])
        + "%, skill=" + str(r["skill_score"])
        + "%, domain=" + str(r["domain_boost"]) + "%)"
        + " | " + r["confidence"] + " confidence"
    )
    output_lines.append(line)

output_lines.append("")
output_lines.append("Career Advice: " + result["career_advice"])

for line in output_lines:
    print(line)

# Also save to file
with open("test_output.txt", "w") as f:
    f.write("\n".join(output_lines))

print("\nSaved to test_output.txt")
