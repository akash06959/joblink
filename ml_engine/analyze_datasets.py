import pandas as pd  # type: ignore
import json
import os

BASE_DIR = r"d:\College\Sem4 Project\ml_engine\datasets"

files_to_check = [
    "occupations_en.csv",
    "skills_en.csv",
    "occupationSkillRelations_en.csv",
    r"db_29_0_text\Occupation Data.txt",
    r"db_29_0_text\Technology Skills.txt"
]

for file in files_to_check:
    path = os.path.join(BASE_DIR, file)
    print(f"\n==================== {file} ====================")
    try:
        if file.endswith('.txt'):
            df = pd.read_csv(path, sep='\t', nrows=2)
            if len(df.columns) == 1: # Maybe it's not tab separated
                df = pd.read_csv(path, sep=',', nrows=2)
        else:
            df = pd.read_csv(path, nrows=2)
        print("Columns:", list(df.columns))
        print("Sample Row 1:", df.iloc[0].to_dict() if len(df) > 0 else "Empty")
    except Exception as e:
        print("Error:", e)
