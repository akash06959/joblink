import os
import shutil

BASE_DIR = r"d:\College\Sem4 Project\ml_engine\datasets"

# Whitelist of files we WANT to keep in the root `datasets` folder
root_whitelist = {
    "occupations_en.csv",
    "skills_en.csv",
    "occupationSkillRelations_en.csv",
    "job_title_des.csv",  # keeping the old ones for now just in case
    "skills.csv",
    "db_29_0_text"        # going inside this to filter
}

# Whitelist of files we WANT to keep inside `db_29_0_text`
db_whitelist = {
    "Occupation Data.txt",
    "Technology Skills.txt"
}

deleted_files: int = 0
deleted_dirs: int = 0

print("Cleaning up unwanted datasets...")

for item in os.listdir(BASE_DIR):
    item_path = os.path.join(BASE_DIR, item)
    
    if item not in root_whitelist:
        # Delete unwanted files and directories (like the entire 'data' folder)
        if os.path.isdir(item_path):
            print(f"Deleting directory: {item}")
            shutil.rmtree(item_path)
            deleted_dirs = int(deleted_dirs + 1)  # type: ignore[operator]
        else:
            print(f"Deleting file: {item}")
            os.remove(item_path)
            deleted_files = int(deleted_files + 1)  # type: ignore[operator]

# Now go inside db_29_0_text and delete unwanted TXT files
db_path = os.path.join(BASE_DIR, "db_29_0_text")
if os.path.exists(db_path):
    for item in os.listdir(db_path):
        if item not in db_whitelist:
            item_path = os.path.join(db_path, item)
            if os.path.isfile(item_path):
                os.remove(item_path)
                deleted_files = int(deleted_files + 1)  # type: ignore[operator]

print(f"\nCleanup complete. Deleted {deleted_files} files and {deleted_dirs} directories.")
