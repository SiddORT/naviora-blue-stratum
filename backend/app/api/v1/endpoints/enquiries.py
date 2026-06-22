"""CRM Enquiries & Onboarding endpoints — public submissions + admin review."""
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.schemas.enquiry import (
    CandidateRegistrationCreate,
    ContactEnquiryCreate,
    EnquiryAssign,
    EnquiryNoteCreate,
    EnquiryReject,
    EnquiryStatusUpdate,
    OnboardingApprove,
    OrgRegistrationCreate,
    PlanEnquiryCreate,
)
from app.services.enquiry import EnquiryService
from app.utils.responses import (
    created_response,
    error_response,
    not_found_response,
    success_response,
)

router = APIRouter()


def _ip(request: Request) -> Optional[str]:
    fwd = request.headers.get("X-Forwarded-For")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None


def _ua(request: Request) -> Optional[str]:
    return request.headers.get("User-Agent")


# ─── Public submission routes (no auth) ──────────────────────────────────────

@router.post("/enquiries/contact", tags=["Public"])
async def submit_contact_enquiry(
    body: ContactEnquiryCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Public contact / demo-request form from landing page."""
    svc = EnquiryService(db)
    try:
        result = await svc.submit_contact(body, ip=_ip(request), ua=_ua(request))
    except Exception as exc:
        return error_response(message=str(exc))
    return created_response(data=result.model_dump(), message="Your request has been received. We will be in touch shortly.")


@router.post("/enquiries/plan", tags=["Public"])
async def submit_plan_enquiry(
    body: PlanEnquiryCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Plan interest form from /plans page."""
    svc = EnquiryService(db)
    try:
        result = await svc.submit_plan_enquiry(body, ip=_ip(request), ua=_ua(request))
    except Exception as exc:
        return error_response(message=str(exc))
    return created_response(data=result.model_dump(), message="Plan enquiry received.")


@router.post("/enquiries/register/organization", tags=["Public"])
async def submit_org_registration(
    body: OrgRegistrationCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Organization self-registration from /register."""
    svc = EnquiryService(db)
    try:
        result = await svc.submit_org_registration(body, ip=_ip(request), ua=_ua(request))
    except Exception as exc:
        return error_response(message=str(exc))
    return created_response(data=result.model_dump(), message="Registration request received. An administrator will review and contact you.")


@router.post("/enquiries/register/candidate", tags=["Public"])
async def submit_candidate_registration(
    body: CandidateRegistrationCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Candidate self-registration from /register."""
    svc = EnquiryService(db)
    try:
        result = await svc.submit_candidate_registration(body, ip=_ip(request), ua=_ua(request))
    except Exception as exc:
        return error_response(message=str(exc))
    return created_response(data=result.model_dump(), message="Candidate registration request received.")


# ─── Admin — Enquiries ────────────────────────────────────────────────────────

@router.get("/enquiries", tags=["CRM"])
async def list_enquiries(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    enquiry_type: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    data = await svc.list_enquiries(page, page_size, search, enquiry_type, status, sort_by, sort_order)
    return success_response(data=data.model_dump())


@router.get("/enquiries/{uuid}", tags=["CRM"])
async def get_enquiry(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    try:
        return success_response(data=(await svc.get_enquiry(uuid)).model_dump())
    except ValueError:
        return not_found_response("Enquiry")


@router.patch("/enquiries/{uuid}/status", tags=["CRM"])
async def update_enquiry_status(
    uuid: str,
    body: EnquiryStatusUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    try:
        return success_response(data=(await svc.update_status(uuid, body.status, current_user.uuid)).model_dump())
    except ValueError as exc:
        return error_response(message=str(exc))


@router.patch("/enquiries/{uuid}/assign", tags=["CRM"])
async def assign_enquiry(
    uuid: str,
    body: EnquiryAssign,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    try:
        return success_response(data=(await svc.assign(uuid, body.assigned_to, current_user.uuid)).model_dump())
    except ValueError as exc:
        return error_response(message=str(exc))


@router.post("/enquiries/{uuid}/notes", tags=["CRM"])
async def add_note(
    uuid: str,
    body: EnquiryNoteCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    try:
        note = await svc.add_note(
            uuid, body,
            by_uuid=current_user.uuid,
            by_name=getattr(current_user, "full_name", current_user.email),
        )
        return created_response(data=note.model_dump(), message="Note added")
    except ValueError as exc:
        return error_response(message=str(exc))


@router.post("/enquiries/{uuid}/approve", tags=["CRM"])
async def approve_enquiry(
    uuid: str,
    body: OnboardingApprove,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    try:
        onb = await svc.approve(uuid, body, current_user.uuid)
        return created_response(data=onb.model_dump(), message="Enquiry approved and onboarding record created")
    except ValueError as exc:
        return error_response(message=str(exc))


@router.post("/enquiries/{uuid}/reject", tags=["CRM"])
async def reject_enquiry(
    uuid: str,
    body: EnquiryReject,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    try:
        return success_response(data=(await svc.reject(uuid, body.reason, current_user.uuid)).model_dump(), message="Enquiry rejected")
    except ValueError as exc:
        return error_response(message=str(exc))


@router.post("/enquiries/{uuid}/convert", tags=["CRM"])
async def convert_enquiry(
    uuid: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    try:
        return success_response(data=(await svc.mark_converted(uuid, current_user.uuid)).model_dump(), message="Enquiry marked as converted")
    except ValueError as exc:
        return error_response(message=str(exc))


# ─── Admin — Onboarding ───────────────────────────────────────────────────────

@router.get("/onboarding", tags=["CRM"])
async def list_onboarding(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    onboarding_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    data = await svc.list_onboarding(page, page_size, onboarding_type, status)
    return success_response(data=data.model_dump())


# ─── Admin — Consent records ──────────────────────────────────────────────────

@router.get("/consent-records", tags=["CRM"])
async def list_consent_records(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    marketing_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    svc = EnquiryService(db)
    data = await svc.list_consents(page, page_size, marketing_only)
    return success_response(data=data.model_dump())
