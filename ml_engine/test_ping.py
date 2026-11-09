import requests  # type: ignore

url = "http://localhost:8000/api/analyze"

# We create a dummy tiny PDF in memory
payload={"job_description": "We are looking for a Python Software Engineer with experience in Machine Learning, Docker, and AWS."}
files=[
  ('resume',('dummy.pdf',b'%PDF-1.4\n1 0 obj\n<<>>\nstream\nI am a Python developer with 3 years machine learning experience using Pytorch and Pandas. I deployed apps using Docker.\nendstream\nendobj\ntrailer\n<<>>\n%%EOF','application/pdf'))
]

response = requests.request("POST", url, data=payload, files=files)

print(response.text)
