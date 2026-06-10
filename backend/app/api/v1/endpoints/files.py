"""File upload endpoint — stores metadata in DB, file on disk."""
import os
import uuid as _uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.models.file_metadata import FileMetadata
from app.storage.local import LocalStorageProvider
from app.utils.responses import created_response, error_response

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
}


@router.post(
    "/upload",
    summary="Upload a file",
    dependencies=[Depends(check_permissions(["files.upload"]))],
)
async def upload_file(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
    entity_type: Optional[str] = Form(default=None),
    entity_id: Optional[str] = Form(default=None),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        return error_response(
            message=f"File type '{file.content_type}' is not allowed",
            status_code=415,
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        return error_response(
            message=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB",
            status_code=413,
        )

    category = entity_type or "temp"
    ext = os.path.splitext(file.filename or "file")[1]
    unique_name = f"{_uuid.uuid4().hex}{ext}"

    storage = LocalStorageProvider(settings.UPLOAD_DIR)
    dest_path = LocalStorageProvider.build_path(category, unique_name)
    stored_path = await storage.upload(content, dest_path, content_type=file.content_type)

    meta = FileMetadata(
        organization_id=current_user.organization_id,
        uploaded_by=current_user.uuid,
        file_name=unique_name,
        original_name=file.filename or unique_name,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        file_path=stored_path,
        storage_provider=settings.STORAGE_PROVIDER,
        entity_type=entity_type,
        entity_id=entity_id,
        created_by=current_user.uuid,
        updated_by=current_user.uuid,
    )
    db.add(meta)
    await db.flush()
    await db.refresh(meta)

    return created_response(
        data={
            "uuid": meta.uuid,
            "file_name": meta.file_name,
            "original_name": meta.original_name,
            "file_size": meta.file_size,
            "mime_type": meta.mime_type,
            "file_path": meta.file_path,
            "storage_provider": meta.storage_provider,
            "url": await storage.get_url(stored_path),
        },
        message="File uploaded successfully",
    )
