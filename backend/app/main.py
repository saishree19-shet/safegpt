"""
Main FastAPI application entrypoint for Safe, Offline Chatbot.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(
    title="Safe Company Chatbot API",
    description="Offline, privacy-focused chatbot for company documents",
    version="0.1.0",
)

# Configure CORS (Cross-Origin Resource Sharing)
# Needed for future frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
def read_root():
    """
    Root endpoint providing a friendly status greeting and API pointers.
    """
    return {
        "message": "Welcome to Safe Company Chatbot API",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint for monitoring service availability.
    """
    return {
        "status": "ok"
    }
