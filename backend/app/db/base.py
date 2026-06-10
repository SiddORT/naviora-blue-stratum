"""SQLAlchemy declarative base — imported by all models."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Common declarative base for all ORM models."""
    pass
