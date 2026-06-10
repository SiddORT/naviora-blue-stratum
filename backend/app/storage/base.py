"""Storage provider interface — business logic never knows which backend is used."""
from abc import ABC, abstractmethod
from typing import Optional


class StorageProvider(ABC):
    """
    Abstract storage interface.
    Implement this for Local, S3, Azure Blob, or MinIO.
    """

    @abstractmethod
    async def upload(
        self,
        file_data: bytes,
        destination_path: str,
        content_type: Optional[str] = None,
    ) -> str:
        """Upload file bytes to destination_path. Returns the stored path."""

    @abstractmethod
    async def delete(self, file_path: str) -> bool:
        """Delete a file by path. Returns True on success."""

    @abstractmethod
    async def exists(self, file_path: str) -> bool:
        """Check whether a file exists at the given path."""

    @abstractmethod
    async def get_url(self, file_path: str, expires_in: int = 3600) -> str:
        """Return a URL to access the file (local path, pre-signed URL, etc.)."""
