import pandas as pd  # type: ignore
import json
import os

BASE_DIR = r"d:\College\Sem4 Project\ml_engine\datasets"
OUT_FILE = r"d:\College\Sem4 Project\ml_engine\out_analysis.txt"

files_to_check = [
    "occupations_en.csv",
    "skills_en.csv",
    "occupationSkillRelations_en.csv",
    r"db_29_0_text\Occupation Data.txt",
    r"db_29_0_text\Technology Skills.txt"
]

with open(OUT_FILE, "w", encoding='utf-8') as f:
    for file in files_to_check:
        path = os.path.join(BASE_DIR, file)
        f.write(f"\n==================== {file} ====================\n")
        try:
            if file.endswith('.txt'):
                df = pd.read_csv(path, sep='\t', nrows=2)
                if len(df.columns) == 1:
                    df = pd.read_csv(path, sep=',', nrows=2)
            else:
                df = pd.read_csv(path, nrows=2)
            f.write(f"Columns: {list(df.columns)}\n")
            if len(df) > 0:
                row_dict = df.iloc[0].to_dict()
                for k, v in row_dict.items():
                    # Truncate very long description texts for readability
                    val_str = str(v)
                    if len(val_str) > 100:
                        val_str = val_str[:100] + "..."  # type: ignore
                    f.write(f"  {k}: {val_str}\n")
        except Exception as e:
            f.write(f"Error: {e}\n")
