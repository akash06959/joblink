import requests  # type: ignore
import json

url = "http://localhost:8000/api/analyze-text"
payload = {
    "resume_text": "I am a seasoned Software Engineer with 5 years of experience in Python, Django, and Machine Learning. I have built scalable APIs and deployed on AWS.",
    "job_description": "Looking for a Software Engineer with Python and Django experience."
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
