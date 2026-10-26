

from fastapi import FastAPI
from sqlalchemy import text

from app import models
from app.database import Base, engine
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router

app = FastAPI(
    title="Safe Company Chatbot",
    description="A privacy-focused chatbot for company documents",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(documents_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Safe Company Chatbot API",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health"
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/database")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "status": "ok"
        }

    except Exception:
        return {
            "database": "unavailable",
            "status": "error"
        }

