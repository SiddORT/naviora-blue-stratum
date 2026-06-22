"""
Public contact / demo-request endpoint.

Submissions are now persisted to the enquiries table via EnquiryService.
The old log-only implementation is superseded by the CRM module.
This thin wrapper keeps backward compatibility for the /contact URL.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.enquiry import ContactEnquiryCreate, ConsentPayload
from app.services.enquiry import EnquiryService
from app.utils.responses import created_response, error_response

router = APIRouter()


@router.post("/contact", tags=["Public"])
async def submit_contact(
    payload: ContactEnquiryCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Public contact / demo-request form.
    Persists to enquiries table with enquiry_type=CONTACT.
    No authentication required.
    """
    ip = None
    fwd = request.headers.get("X-Forwarded-For")
    if fwd:
        ip = fwd.split(",")[0].strip()
    elif request.client:
        ip = request.client.host
    ua = request.headers.get("User-Agent")

    svc = EnquiryService(db)
    try:
        result = await svc.submit_contact(payload, ip=ip, ua=ua)
    except Exception as exc:
        return error_response(message=str(exc))
    return created_response(
        data={"uuid": result.uuid},
        message="Demo request received. We will be in touch shortly.",
    )
