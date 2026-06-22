"""Public contact / demo-request endpoint."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from app.schemas.common import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class ContactRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    organization: str
    role: str = ""
    message: str = ""


@router.post("/contact", response_model=SuccessResponse[None])
async def submit_contact(payload: ContactRequest):
    """
    Public endpoint — no auth required.
    Logs the demo request and returns 200.
    In production, integrate with CRM / email provider here.
    """
    logger.info(
        "Demo request received | name=%s %s | email=%s | org=%s | role=%s | ts=%s",
        payload.first_name,
        payload.last_name,
        payload.email,
        payload.organization,
        payload.role,
        datetime.now(timezone.utc).isoformat(),
    )
    return SuccessResponse(data=None, message="Demo request received. We will be in touch shortly.")
