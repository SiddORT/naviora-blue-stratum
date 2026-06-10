"""PASE Compass by Blue Stratum — FastAPI Application Entry Point."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.router import api_router
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import RequestLoggingMiddleware

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    for folder in [
        "organizations", "users", "certificates", "assessments",
        "simulators", "exercises", "accidents", "reports", "temp",
    ]:
        os.makedirs(os.path.join(settings.UPLOAD_DIR, folder), exist_ok=True)
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def create_application() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="PASE Compass — Maritime Assessment & Simulation Platform by Blue Stratum",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(ErrorHandlerMiddleware)

    upload_dir = settings.UPLOAD_DIR
    if os.path.exists(upload_dir):
        app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
