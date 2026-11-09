import pandas as pd  # type: ignore
import json
import os
import re

# Set up paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "datasets")
OUT_DIR = os.path.join(BASE_DIR, "processed")

if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

print("Starting compact dataset preprocessing...")

# ---------------------------------------------------------
# 1. Process Master Skills Dictionary
# ---------------------------------------------------------
print("Compiling global skills dictionary (O*NET + ESCO)...")
skills_set = set()

# A. Add O*NET Technology Skills
try:
    tech_skills_path = os.path.join(DATA_DIR, "db_29_0_text", "Technology Skills.txt")
    if os.path.exists(tech_skills_path):
        df_tech = pd.read_csv(tech_skills_path, sep='\t')
        if len(df_tech.columns) == 1:
            df_tech = pd.read_csv(tech_skills_path, sep=',')
        
        if 'Example' in df_tech.columns:
            # Add all the exact software tools (e.g., Python, AutoCAD, Tableau)
            for skill in df_tech['Example'].dropna():
                skills_set.add(str(skill).strip().lower())
    print(f"Added O*NET tech skills. Total: {len(skills_set)}")
except Exception as e:
    print(f"Error reading O*NET Technology Skills: {e}")

# B. Add ESCO Skills
try:
    esco_skills_path = os.path.join(DATA_DIR, "skills_en.csv")
    if os.path.exists(esco_skills_path):
        df_esco_skills = pd.read_csv(esco_skills_path)
        if 'preferredLabel' in df_esco_skills.columns:
            for skill in df_esco_skills['preferredLabel'].dropna():
                skills_set.add(str(skill).strip().lower())
        if 'altLabels' in df_esco_skills.columns:
            for labels in df_esco_skills['altLabels'].dropna():
                for alt_skill in str(labels).split('\n'):
                    if alt_skill.strip():
                        skills_set.add(alt_skill.strip().lower())
    print(f"Added ESCO skills. Total: {len(skills_set)}")
except Exception as e:
    print(f"Error reading ESCO skills: {e}")

# Filter out very short or extremely long nonsensical skills
final_skills = [
    s for s in skills_set 
    if len(s) >= 2 and len(s) <= 60 and not re.match(r'^[0-9]+$', s)
]

with open(os.path.join(OUT_DIR, "refined_skills.json"), "w", encoding="utf-8") as f:
    json.dump({"skills": sorted(list(final_skills))}, f, indent=4)

print(f"✅ Generated refined_skills.json with {len(final_skills)} highly accurate unique skills.")


# ---------------------------------------------------------
# 2. Process High-Quality Job Roles & Descriptions 
# ---------------------------------------------------------
print("Compiling global job descriptions dictionary (O*NET + ESCO)...")
jobs_dict = {}

# A. O*NET Occupations (Gold Standard for descriptions)
try:
    onet_occ_path = os.path.join(DATA_DIR, "db_29_0_text", "Occupation Data.txt")
    if os.path.exists(onet_occ_path):
        df_onet = pd.read_csv(onet_occ_path, sep='\t')
        if len(df_onet.columns) == 1:
            df_onet = pd.read_csv(onet_occ_path, sep=',')
            
        if 'Title' in df_onet.columns and 'Description' in df_onet.columns:
            for _, row in df_onet.iterrows():
                title = str(row['Title']).strip()
                desc = str(row['Description']).strip()
                # O*NET titles often have commas (e.g. "Managers, All Other"). Clean them up.
                if "," in title:
                    parts = [p.strip() for p in title.split(",")]
                    title = " ".join(list(reversed(parts)))  # Reverse it: "All Other Managers"
                
                if len(desc) > 50:
                    jobs_dict[title] = desc
    print(f"Added O*NET Occupations. Total unique jobs: {len(jobs_dict)}")
except Exception as e:
    print(f"Error reading O*NET Occupations: {e}")

# B. ESCO Occupations (Great for broad European coverage)
try:
    esco_occ_path = os.path.join(DATA_DIR, "occupations_en.csv")
    if os.path.exists(esco_occ_path):
        df_esco = pd.read_csv(esco_occ_path)
        if 'preferredLabel' in df_esco.columns and 'description' in df_esco.columns:
            # ESCO has thousands of extreme niches, let's keep only high-quality ones
            # Random sampling or filtering could happen here, but dictionaries deduplicate well.
            for _, row in df_esco.iterrows():
                title = str(row['preferredLabel']).strip().title()
                desc = str(row['description']).strip()
                # Don't overwrite richer O*NET descriptions if we already have the title
                if title not in jobs_dict and len(desc) > 50:
                    jobs_dict[title] = desc
    print(f"Added ESCO Occupations. Total unique jobs: {len(jobs_dict)}")
except Exception as e:
    print(f"Error reading ESCO Occupations: {e}")

with open(os.path.join(OUT_DIR, "refined_jobs.json"), "w", encoding="utf-8") as f:
    json.dump(jobs_dict, f, indent=4)

print(f"✅ Generated refined_jobs.json with {len(jobs_dict)} unparalleled high-quality job descriptions.")

print("\n🚀 Compact Preprocessing Complete! Files are ready in the 'processed' directory for ML engine ingestion.")
