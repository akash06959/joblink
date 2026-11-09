import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import time

def run():
    print("Loading Engine...")
    t0 = time.time()
    from src.analyzer import ResumeAnalyzer
    x = ResumeAnalyzer()
    print(f"Boot: {time.time()-t0:.2f}s")
    
    t1 = time.time()
    res = x.analyze(
        "software engineer skilled in python django and react with machine learning data algorithms",
        "Looking for a backend machine learning developer fluent in Python"
    )
    print(f"Analyze Time: {time.time()-t1:.4f}s")
    print(res["matched_skills"])
    print(res["recommended_roles"][0])

if __name__ == "__main__":
    run()
