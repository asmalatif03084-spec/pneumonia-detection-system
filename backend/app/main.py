
from fastapi import FastAPI

app = FastAPI(
    title="Pneumonia Detection API",
    description="AI-Based Chest X-Ray Analysis Research Project",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Pneumonia Detection API is running!",
        "project": "AI-Based Pneumonia Detection System"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Backend is working successfully"
    }
