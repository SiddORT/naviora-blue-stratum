"""Centralized logging configuration for PASE Compass."""
import logging
import sys
from typing import Optional


def setup_logging(log_level: Optional[str] = None) -> None:
    """
    Configure structured logging for the application.
    Supports future integration with Sentry / Datadog via handlers.
    """
    level = getattr(logging, (log_level or "INFO").upper(), logging.INFO)

    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    date_fmt = "%Y-%m-%d %H:%M:%S"

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt=date_fmt))
    root_logger.addHandler(handler)

    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("passlib").setLevel(logging.ERROR)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger."""
    return logging.getLogger(name)
