"""Local filesystem storage provider."""
import logging
import os
from datetime import datetime
from typing import Optional

from app.storage.base import StorageProvider

logger = logging.getLogger(__name__)


class LocalStorageProvider(StorageProvider):
    """
    Stores files on the local filesystem under UPLOAD_DIR.
    Paths follow the pattern: /uploads/<category>/<YYYY>/<MM>/<filename>
    """

    def __init__(self, base_dir: str) -> None:
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)

    def _full_path(self, file_path: str) -> str:
        # Strip leading slash to avoid absolute path override
        relative = file_path.lstrip("/")
        # Strip the "uploads/" prefix if already present
        if relative.startswith("uploads/"):
            relative = relative[len("uploads/"):]
        return os.path.join(self.base_dir, relative)

    @staticmethod
    def build_path(category: str, filename: str) -> str:
        """Generate a dated path: /uploads/<category>/<YYYY>/<MM>/<filename>"""
        now = datetime.utcnow()
        return f"/uploads/{category}/{now.year:04d}/{now.month:02d}/{filename}"

    async def upload(
        self,
        file_data: bytes,
        destination_path: str,
        content_type: Optional[str] = None,
    ) -> str:
        full_path = self._full_path(destination_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(file_data)
        logger.info("Stored file: %s (%d bytes)", destination_path, len(file_data))
        return destination_path

    async def delete(self, file_path: str) -> bool:
        full_path = self._full_path(file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            logger.info("Deleted file: %s", file_path)
            return True
        return False

    async def exists(self, file_path: str) -> bool:
        return os.path.exists(self._full_path(file_path))

    async def get_url(self, file_path: str, expires_in: int = 3600) -> str:
        # For local storage, return the static file URL served by FastAPI
        path = file_path if file_path.startswith("/uploads") else f"/uploads/{file_path.lstrip('/')}"
        return path
