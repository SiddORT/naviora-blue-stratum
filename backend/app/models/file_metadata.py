"""FileMetadata model — stores file info without BLOBs; actual files live on disk/S3/etc."""
from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampMixin


class FileMetadata(TimestampMixin):
    __tablename__ = "file_metadata"

    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    uploaded_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(200), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    storage_provider: Mapped[str] = mapped_column(String(50), nullable=False, default="local")
    entity_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    def __repr__(self) -> str:
        return f"<FileMetadata id={self.id} original_name={self.original_name!r}>"
