import os
import fitz  # type: ignore  # PyMuPDF
import pandas as pd  # type: ignore

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "datasets", "data", "data")
OUT_DIR = os.path.join(BASE_DIR, "processed")

if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

print("Starting resume extraction...")

data: list = []
categories = os.listdir(DATA_DIR)
total_files = 0
processed_files = 0

for category in categories:
    category_path = os.path.join(DATA_DIR, category)
    if os.path.isdir(category_path):
        files = os.listdir(category_path)
        file_count = len(files)
        total_files += file_count  # type: ignore
        print(f"Extracting category: {category} ({file_count} resumes)")

        for file in files:
            file_path = os.path.join(category_path, file)
            if file.lower().endswith('.pdf'):
                try:
                    doc = fitz.open(file_path)
                    text: str = ""
                    for page in doc:
                        text = text + page.get_text()

                    if len(text.strip()) > 50:
                        data.append({
                            "category": category,
                            "filename": file,
                            "text": text.strip()
                        })
                        processed_files += 1  # type: ignore
                except Exception as e:
                    print(f"Error processing {file}: {e}")

df = pd.DataFrame(data)
out_path = os.path.join(OUT_DIR, "resume_dataset.csv")
df.to_csv(out_path, index=False, encoding='utf-8')
print(f"Extraction complete! Processed {processed_files}/{total_files} files.")
print(f"Saved dataset to: {out_path}")
