"""
Build Job-to-Skill Mapping from ESCO Occupation-Skill Relations dataset.
This creates processed/job_skill_map.json which maps job titles -> required skills.
"""
import pandas as pd  # type: ignore
import json
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RELATIONS_CSV = os.path.join(BASE_DIR, "datasets", "occupationSkillRelations_en.csv")
OCCUPATIONS_CSV = os.path.join(BASE_DIR, "datasets", "occupations_en.csv")
OUT_FILE = os.path.join(BASE_DIR, "processed", "job_skill_map.json")

print("Loading ESCO occupation-skill relations...")
df = pd.read_csv(RELATIONS_CSV)
print(f"Loaded {len(df):,} occupation-skill pairs.")

# We only want "essential" skill/competence skills (not optional knowledge)
# This ensures every mapped skill is genuinely required
essential = df[
    (df["relationType"] == "essential") &
    (df["skillType"] == "skill/competence")
].copy()
print(f"Essential skill/competence relations: {len(essential):,}")

# Normalize labels
essential["occupationLabel"] = essential["occupationLabel"].str.strip().str.title()
essential["skillLabel"] = essential["skillLabel"].str.strip().str.lower()

# Build mapping: { "occupation": ["skill1", "skill2", ...] }
job_skill_map = {}
for occ, group in essential.groupby("occupationLabel"):
    skills = sorted(set(group["skillLabel"].dropna().tolist()))
    if len(skills) > 0:
        job_skill_map[occ] = skills

print(f"\nBuilt skill map for {len(job_skill_map):,} occupations.")

# Show a sample
sample_key = list(job_skill_map.keys())[50]  # type: ignore[index]
print(f"\nSample: '{sample_key}' → {list(job_skill_map[sample_key])[:5]}")

os.makedirs(os.path.join(BASE_DIR, "processed"), exist_ok=True)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(job_skill_map, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {OUT_FILE}")
print(f"Total occupation entries: {len(job_skill_map):,}")
