"""EnquiryService — CRM enquiries, notes, consent, onboarding pipeline."""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enquiry import Enquiry, EnquiryNote
from app.models.enquiry_consent import EnquiryConsent
from app.models.onboarding_request import OnboardingRequest
from app.models.plan import Plan
from app.schemas.enquiry import (
    CandidateRegistrationCreate,
    ConsentPayload,
    ContactEnquiryCreate,
    EnquiryListItem,
    EnquiryNoteCreate,
    EnquiryNoteResponse,
    EnquiryPage,
    EnquiryResponse,
    OnboardingApprove,
    OnboardingPage,
    OnboardingResponse,
    OrgRegistrationCreate,
    PlanEnquiryCreate,
    ConsentRecordPage,
    ConsentRecordListItem,
    ConsentResponse,
)
from app.services.audit import AuditService


def _page(total: int, page: int, page_size: int) -> dict:
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, math.ceil(total / page_size)),
    }


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _note_resp(n: EnquiryNote) -> EnquiryNoteResponse:
    return EnquiryNoteResponse(
        id=n.id, uuid=n.uuid, enquiry_id=n.enquiry_id,
        note=n.note, note_by=n.note_by, note_by_uuid=n.note_by_uuid,
        created_at=n.created_at,
    )


def _consent_resp(c: EnquiryConsent | None) -> ConsentResponse | None:
    if not c:
        return None
    return ConsentResponse(
        id=c.id, enquiry_id=c.enquiry_id,
        privacy_accepted=c.privacy_accepted, terms_accepted=c.terms_accepted,
        data_processing_accepted=c.data_processing_accepted, marketing_accepted=c.marketing_accepted,
        consent_version=c.consent_version, ip_address=c.ip_address, accepted_at=c.accepted_at,
    )


def _enq_response(e: Enquiry) -> EnquiryResponse:
    return EnquiryResponse(
        id=e.id, uuid=e.uuid, enquiry_type=e.enquiry_type,
        first_name=e.first_name, last_name=e.last_name, email=e.email,
        phone=e.phone, company_name=e.company_name, country=e.country,
        selected_plan_id=e.selected_plan_id,
        selected_plan_name=e.selected_plan.name if e.selected_plan else None,
        message=e.message, source_page=e.source_page,
        status=e.status, assigned_to=e.assigned_to,
        duplicate_flag=e.duplicate_flag,
        ip_address=e.ip_address,
        created_at=e.created_at, updated_at=e.updated_at,
        notes=[_note_resp(n) for n in (e.notes or [])],
        consent=_consent_resp(e.consent),
    )


def _enq_list_item(e: Enquiry) -> EnquiryListItem:
    return EnquiryListItem(
        id=e.id, uuid=e.uuid, enquiry_type=e.enquiry_type,
        first_name=e.first_name, last_name=e.last_name, email=e.email,
        company_name=e.company_name, country=e.country,
        selected_plan_id=e.selected_plan_id,
        selected_plan_name=e.selected_plan.name if e.selected_plan else None,
        status=e.status, duplicate_flag=e.duplicate_flag,
        assigned_to=e.assigned_to, created_at=e.created_at,
    )


def _onb_response(o: OnboardingRequest) -> OnboardingResponse:
    enq_email = o.enquiry.email if o.enquiry else None
    enq_name = (
        f"{o.enquiry.first_name} {o.enquiry.last_name}" if o.enquiry else None
    )
    return OnboardingResponse(
        id=o.id, uuid=o.uuid, enquiry_id=o.enquiry_id,
        enquiry_email=enq_email, enquiry_name=enq_name,
        onboarding_type=o.onboarding_type, onboarding_status=o.onboarding_status,
        organization_id=o.organization_id, user_id=o.user_id,
        approved_by=o.approved_by, approved_at=o.approved_at,
        rejected_by=o.rejected_by, rejected_at=o.rejected_at,
        rejection_reason=o.rejection_reason,
        created_at=o.created_at, updated_at=o.updated_at,
    )


class EnquiryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.audit = AuditService(db)

    # ── Duplicate detection ───────────────────────────────────────────────────

    async def _check_duplicates(self, email: str, phone: Optional[str], company: Optional[str]) -> bool:
        """Return True if a live enquiry with same email/phone/company already exists."""
        conditions = [Enquiry.email == email.lower()]
        if phone:
            conditions.append(Enquiry.phone == phone)
        if company:
            conditions.append(func.lower(Enquiry.company_name) == company.lower())
        q = select(Enquiry.id).where(
            or_(*conditions),
            Enquiry.deleted_at.is_(None),
            Enquiry.status.not_in(["REJECTED", "CONVERTED"]),
        ).limit(1)
        result = await self.db.execute(q)
        return result.scalar_one_or_none() is not None

    # ── Internal helpers ──────────────────────────────────────────────────────

    async def _create_enquiry_record(
        self,
        *,
        enquiry_type: str,
        first_name: str,
        last_name: str,
        email: str,
        phone: Optional[str],
        company_name: Optional[str],
        country: Optional[str],
        selected_plan_id: Optional[int],
        message: Optional[str],
        source_page: Optional[str],
        consent: ConsentPayload,
        ip_address: Optional[str],
        user_agent: Optional[str],
    ) -> Enquiry:
        dup = await self._check_duplicates(email, phone, company_name)
        enq = Enquiry(
            enquiry_type=enquiry_type,
            first_name=first_name,
            last_name=last_name,
            email=email.lower(),
            phone=phone,
            company_name=company_name,
            country=country,
            selected_plan_id=selected_plan_id,
            message=message,
            source_page=source_page,
            status="NEW",
            duplicate_flag=dup,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(enq)
        await self.db.flush()  # get enq.id

        # Persist consent
        c = EnquiryConsent(
            enquiry_id=enq.id,
            privacy_accepted=consent.privacy_accepted,
            terms_accepted=consent.terms_accepted,
            data_processing_accepted=consent.data_processing_accepted,
            marketing_accepted=consent.marketing_accepted,
            consent_version=consent.consent_version,
            ip_address=ip_address,
            user_agent=user_agent,
            accepted_at=_utcnow(),
        )
        self.db.add(c)
        await self.db.commit()

        enq_id = enq.id
        enq_uuid = enq.uuid
        await self.audit.log(
            module="crm", action="enquiry_created",
            resource_type="enquiry", resource_id=enq_uuid,
            new_values={"type": enquiry_type, "email": email, "status": "NEW"},
            ip_address=ip_address, user_agent=user_agent,
        )
        return await self._load_full(enq_id)

    # ── Public submission endpoints ───────────────────────────────────────────

    async def submit_contact(
        self, body: ContactEnquiryCreate, ip: Optional[str] = None, ua: Optional[str] = None,
    ) -> EnquiryResponse:
        enq = await self._create_enquiry_record(
            enquiry_type="CONTACT",
            first_name=body.first_name, last_name=body.last_name,
            email=body.email, phone=body.phone,
            company_name=body.organization, country=body.country,
            selected_plan_id=None, message=body.message,
            source_page=body.source_page or "/contact",
            consent=body.consent, ip_address=ip, user_agent=ua,
        )
        return _enq_response(enq)

    async def submit_plan_enquiry(
        self, body: PlanEnquiryCreate, ip: Optional[str] = None, ua: Optional[str] = None,
    ) -> EnquiryResponse:
        enq = await self._create_enquiry_record(
            enquiry_type="CUSTOM_PLAN",
            first_name=body.first_name, last_name=body.last_name,
            email=body.email, phone=body.phone,
            company_name=body.organization, country=body.country,
            selected_plan_id=body.selected_plan_id, message=body.message,
            source_page=body.source_page or "/plans",
            consent=body.consent, ip_address=ip, user_agent=ua,
        )
        return _enq_response(enq)

    async def submit_org_registration(
        self, body: OrgRegistrationCreate, ip: Optional[str] = None, ua: Optional[str] = None,
    ) -> EnquiryResponse:
        enq = await self._create_enquiry_record(
            enquiry_type="ORGANIZATION_REGISTRATION",
            first_name=body.first_name, last_name=body.last_name,
            email=body.email, phone=body.phone,
            company_name=body.company_name, country=body.country,
            selected_plan_id=body.selected_plan_id, message=body.message,
            source_page=body.source_page or "/register",
            consent=body.consent, ip_address=ip, user_agent=ua,
        )
        return _enq_response(enq)

    async def submit_candidate_registration(
        self, body: CandidateRegistrationCreate, ip: Optional[str] = None, ua: Optional[str] = None,
    ) -> EnquiryResponse:
        enq = await self._create_enquiry_record(
            enquiry_type="CANDIDATE_REGISTRATION",
            first_name=body.first_name, last_name=body.last_name,
            email=body.email, phone=body.phone,
            company_name=body.company_name, country=body.country,
            selected_plan_id=None, message=body.message,
            source_page=body.source_page or "/register",
            consent=body.consent, ip_address=ip, user_agent=ua,
        )
        return _enq_response(enq)

    # ── Admin — list / get ────────────────────────────────────────────────────

    async def list_enquiries(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        enquiry_type: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> EnquiryPage:
        q = (
            select(Enquiry)
            .options(selectinload(Enquiry.selected_plan))
            .where(Enquiry.deleted_at.is_(None))
        )
        if search:
            term = f"%{search.lower()}%"
            q = q.where(
                or_(
                    func.lower(Enquiry.email).like(term),
                    func.lower(Enquiry.first_name).like(term),
                    func.lower(Enquiry.last_name).like(term),
                    func.lower(Enquiry.company_name).like(term),
                )
            )
        if enquiry_type:
            q = q.where(Enquiry.enquiry_type == enquiry_type)
        if status:
            q = q.where(Enquiry.status == status)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        col = getattr(Enquiry, sort_by, Enquiry.created_at)
        q = q.order_by(col.desc() if sort_order == "desc" else col.asc())
        q = q.offset((page - 1) * page_size).limit(page_size)

        rows = (await self.db.execute(q)).scalars().all()
        return EnquiryPage(items=[_enq_list_item(e) for e in rows], **_page(total, page, page_size))

    async def get_enquiry(self, uuid: str) -> EnquiryResponse:
        q = (
            select(Enquiry)
            .options(
                selectinload(Enquiry.notes),
                selectinload(Enquiry.consent),
                selectinload(Enquiry.selected_plan),
                selectinload(Enquiry.onboarding_request),
            )
            .where(Enquiry.uuid == uuid, Enquiry.deleted_at.is_(None))
        )
        enq = (await self.db.execute(q)).scalar_one_or_none()
        if not enq:
            raise ValueError(f"Enquiry {uuid!r} not found")
        return _enq_response(enq)

    # ── Admin — status / assignment ───────────────────────────────────────────

    async def update_status(self, uuid: str, new_status: str, by_uuid: str) -> EnquiryResponse:
        enq = await self._load(uuid)
        old_status = enq.status
        enq_id = enq.id
        enq.status = new_status
        enq.updated_by = by_uuid
        await self.db.commit()
        await self.audit.log(
            module="crm", action="enquiry_status_changed",
            resource_type="enquiry", resource_id=uuid,
            user_id=by_uuid,
            old_values={"status": old_status},
            new_values={"status": new_status},
        )
        return _enq_response(await self._load_full(enq_id))

    async def assign(self, uuid: str, assigned_to: Optional[str], by_uuid: str) -> EnquiryResponse:
        enq = await self._load(uuid)
        enq_id = enq.id
        enq.assigned_to = assigned_to
        enq.updated_by = by_uuid
        await self.db.commit()
        return _enq_response(await self._load_full(enq_id))

    # ── Admin — notes ─────────────────────────────────────────────────────────

    async def add_note(
        self, uuid: str, body: EnquiryNoteCreate, by_uuid: str, by_name: str,
    ) -> EnquiryNoteResponse:
        enq = await self._load(uuid)
        note = EnquiryNote(
            enquiry_id=enq.id,
            note=body.note,
            note_by=by_name,
            note_by_uuid=by_uuid,
            created_by=by_uuid,
        )
        self.db.add(note)
        if enq.status == "NEW":
            enq.status = "CONTACTED"
            enq.updated_by = by_uuid
        await self.db.flush()
        note_id = note.id
        await self.db.commit()
        await self.audit.log(
            module="crm", action="enquiry_note_added",
            resource_type="enquiry", resource_id=uuid,
            user_id=by_uuid,
        )
        # Reload note cleanly
        from sqlalchemy import select as _select
        note_q = _select(EnquiryNote).where(EnquiryNote.id == note_id)
        note = (await self.db.execute(note_q)).scalar_one()
        return _note_resp(note)

    # ── Admin — approve / reject ──────────────────────────────────────────────

    async def approve(self, uuid: str, body: OnboardingApprove, by_uuid: str) -> OnboardingResponse:
        enq = await self._load(uuid)
        if enq.status in ("REJECTED", "CONVERTED"):
            raise ValueError(f"Cannot approve enquiry in status {enq.status!r}")

        onboarding_type = (
            "ORGANIZATION"
            if enq.enquiry_type == "ORGANIZATION_REGISTRATION"
            else "CANDIDATE"
        )
        enq.status = "APPROVED"
        enq.updated_by = by_uuid

        onb = OnboardingRequest(
            enquiry_id=enq.id,
            onboarding_type=onboarding_type,
            onboarding_status="APPROVED",
            organization_id=body.organization_id,
            approved_by=by_uuid,
            approved_at=_utcnow(),
            created_by=by_uuid,
        )
        if body.selected_plan_id:
            enq.selected_plan_id = body.selected_plan_id

        self.db.add(onb)
        if body.notes:
            n = EnquiryNote(
                enquiry_id=enq.id, note=body.notes,
                note_by="System", note_by_uuid=by_uuid, created_by=by_uuid,
            )
            self.db.add(n)

        await self.db.commit()
        await self.db.refresh(onb)

        await self.audit.log(
            module="crm", action="enquiry_approved",
            resource_type="enquiry", resource_id=enq.uuid,
            user_id=by_uuid,
            new_values={"onboarding_type": onboarding_type},
        )
        onb_q = (
            select(OnboardingRequest)
            .options(selectinload(OnboardingRequest.enquiry))
            .where(OnboardingRequest.id == onb.id)
        )
        onb = (await self.db.execute(onb_q)).scalar_one()
        return _onb_response(onb)

    async def reject(self, uuid: str, reason: Optional[str], by_uuid: str) -> EnquiryResponse:
        enq = await self._load(uuid)
        enq_id = enq.id
        enq.status = "REJECTED"
        enq.updated_by = by_uuid
        if reason:
            n = EnquiryNote(
                enquiry_id=enq.id,
                note=f"[Rejected] {reason}",
                note_by="System",
                note_by_uuid=by_uuid,
                created_by=by_uuid,
            )
            self.db.add(n)
        await self.db.commit()
        await self.audit.log(
            module="crm", action="enquiry_rejected",
            resource_type="enquiry", resource_id=uuid,
            user_id=by_uuid, new_values={"reason": reason},
        )
        return _enq_response(await self._load_full(enq_id))

    async def mark_converted(self, uuid: str, by_uuid: str) -> EnquiryResponse:
        enq = await self._load(uuid)
        enq_id = enq.id
        enq.status = "CONVERTED"
        enq.updated_by = by_uuid
        await self.db.commit()
        await self.audit.log(
            module="crm", action="enquiry_converted",
            resource_type="enquiry", resource_id=uuid,
            user_id=by_uuid,
        )
        return _enq_response(await self._load_full(enq_id))

    # ── Onboarding ─────────────────────────────────────────────────────────────

    async def list_onboarding(
        self,
        page: int = 1,
        page_size: int = 20,
        onboarding_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> OnboardingPage:
        q = (
            select(OnboardingRequest)
            .options(selectinload(OnboardingRequest.enquiry))
            .where(OnboardingRequest.deleted_at.is_(None))
        )
        if onboarding_type:
            q = q.where(OnboardingRequest.onboarding_type == onboarding_type)
        if status:
            q = q.where(OnboardingRequest.onboarding_status == status)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        q = q.order_by(OnboardingRequest.created_at.desc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        return OnboardingPage(items=[_onb_response(o) for o in rows], **_page(total, page, page_size))

    # ── Consent records ────────────────────────────────────────────────────────

    async def list_consents(
        self, page: int = 1, page_size: int = 20, marketing_only: bool = False,
    ) -> ConsentRecordPage:
        q = (
            select(EnquiryConsent)
            .options(selectinload(EnquiryConsent.enquiry))
        )
        if marketing_only:
            q = q.where(EnquiryConsent.marketing_accepted.is_(True))
        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()
        q = q.order_by(EnquiryConsent.accepted_at.desc())
        q = q.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(q)).scalars().all()
        items = []
        for c in rows:
            enq = c.enquiry
            items.append(ConsentRecordListItem(
                id=c.id, enquiry_id=c.enquiry_id,
                enquiry_email=enq.email if enq else None,
                enquiry_name=f"{enq.first_name} {enq.last_name}" if enq else None,
                enquiry_type=enq.enquiry_type if enq else None,
                privacy_accepted=c.privacy_accepted,
                terms_accepted=c.terms_accepted,
                data_processing_accepted=c.data_processing_accepted,
                marketing_accepted=c.marketing_accepted,
                consent_version=c.consent_version,
                ip_address=c.ip_address,
                accepted_at=c.accepted_at,
            ))
        return ConsentRecordPage(items=items, **_page(total, page, page_size))

    # ── Private helpers ────────────────────────────────────────────────────────

    async def _load(self, uuid: str) -> Enquiry:
        """Load bare Enquiry row for mutations (no eager-loaded relations)."""
        q = select(Enquiry).where(Enquiry.uuid == uuid, Enquiry.deleted_at.is_(None))
        enq = (await self.db.execute(q)).scalar_one_or_none()
        if not enq:
            raise ValueError(f"Enquiry {uuid!r} not found")
        return enq

    async def _load_full(self, enquiry_id: int) -> Enquiry:
        """Reload Enquiry with all eager-loaded relations needed by _enq_response."""
        q = (
            select(Enquiry)
            .options(
                selectinload(Enquiry.selected_plan),
                selectinload(Enquiry.notes),
                selectinload(Enquiry.consent),
            )
            .where(Enquiry.id == enquiry_id, Enquiry.deleted_at.is_(None))
        )
        return (await self.db.execute(q)).scalar_one()
