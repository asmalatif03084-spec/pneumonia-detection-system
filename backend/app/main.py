
import os

# Reduce TensorFlow compilation overhead
os.environ["TF_XLA_FLAGS"] = "--tf_xla_auto_jit=0"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.predict import router as predict_router

app = FastAPI(
    title="Pneumonia Detection API",
    description="AI-Based Chest X-Ray Analysis Research Project",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)


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
