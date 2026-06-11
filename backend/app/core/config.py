"""Application configuration loaded from environment variables."""
import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "PASE Compass"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security — injected from SESSION_SECRET env var
    SECRET_KEY: str = "dev-secret-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    BCRYPT_ROUNDS: int = 12

    # Field-level encryption — injected from ENCRYPTION_KEY env var
    # Must be a 64-character hex string (32 bytes / AES-256).
    # Do NOT change this value after data is written — all existing
    # encrypted fields will become unreadable.
    ENCRYPTION_KEY: str = ""

    # Database
    DATABASE_URL: str = ""

    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]

    # Storage
    STORAGE_PROVIDER: str = "local"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Seed data
    SUPER_ADMIN_EMAIL: str = "admin@naviora.com"
    SUPER_ADMIN_PASSWORD: str = "Admin@2026!"
    SUPER_ADMIN_NAME: str = "Super Admin"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
        case_sensitive=True,
    )

    @property
    def async_database_url(self) -> str:
        """
        Return asyncpg-compatible database URL.
        asyncpg does not accept sslmode= ; convert it to ssl=.
        """
        url = os.environ.get("DATABASE_URL", self.DATABASE_URL)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # asyncpg uses ?ssl=<mode> not ?sslmode=<mode>
        url = url.replace("?sslmode=require", "?ssl=require")
        url = url.replace("&sslmode=require", "&ssl=require")
        url = url.replace("?sslmode=disable", "")
        url = url.replace("&sslmode=disable", "")
        return url

    @property
    def sync_database_url(self) -> str:
        """Return psycopg2-compatible database URL (for Alembic)."""
        url = os.environ.get("DATABASE_URL", self.DATABASE_URL)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings(
        SECRET_KEY=os.environ.get("SESSION_SECRET", "dev-secret-change-in-production"),
        DATABASE_URL=os.environ.get("DATABASE_URL", ""),
        ENCRYPTION_KEY=os.environ.get("ENCRYPTION_KEY", ""),
    )


settings: Settings = get_settings()
