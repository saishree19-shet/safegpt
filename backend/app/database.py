
from pathlib import Path
from typing import Generator

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker


ENV_FILE = Path(__file__).resolve().parents[1] / ".env"

INSECURE_DEV_SECRETS = {
    "secret",
    "change-me",
    "changeme",
    "your-secret-key",
    "your_secret_key",
    "default-secret",
    "default_secret",
    "jwt-secret",
    "jwt_secret",
    "secret123",
    "password",
    "12345678",
    "insecure",
    "test_secret",
    "supersecret",
}


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        extra="ignore"
    )

    @classmethod
    def validate_jwt_secret_value(cls, v: str) -> str:
        """Validate that the JWT secret is non-empty, strong, and not a known insecure default."""
        cleaned = v.strip() if v else ""
        if not cleaned:
            raise ValueError("JWT_SECRET_KEY cannot be empty.")
        if cleaned.lower() in INSECURE_DEV_SECRETS:
            raise ValueError(
                "JWT_SECRET_KEY is set to a known insecure development default. "
                "Configure a cryptographically strong secret."
            )
        if len(cleaned) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters long for HS256 to meet RFC 7518 security requirements."
            )
        return cleaned

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.validate_jwt_secret_value(self.JWT_SECRET_KEY)


settings = Settings()


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional database session and ensure it closes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_database_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar()

