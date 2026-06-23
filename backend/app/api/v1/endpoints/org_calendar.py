"""Organization Portal — Assessment Calendar endpoint."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.org_auth import CurrentOrgUser
from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assessment_campaign import AssessmentCampaign
from app.schemas.org_campaigns import CalendarEvent
from app.utils.responses import success_response

router = APIRouter()


@router.get("", summary="Calendar events — campaigns with date windows")
async def get_calendar_events(
    ctx: CurrentOrgUser,
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    base = select(AssessmentCampaign).where(
        and_(
            AssessmentCampaign.organization_id == ctx.organization_id,
            AssessmentCampaign.deleted_at.is_(None),
            AssessmentCampaign.status.notin_(["Archived"]),
        )
    )
    if year and month:
        from datetime import date
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1)
        else:
            last_day = date(year, month + 1, 1)
        base = base.where(
            (AssessmentCampaign.start_date <= last_day) &
            (AssessmentCampaign.end_date >= first_day)
        )

    rows = (await db.execute(base.order_by(AssessmentCampaign.start_date))).scalars().all()

    events = []
    for c in rows:
        count = (await db.execute(
            select(func.count()).where(
                and_(AssessmentAssignment.campaign_id == c.id, AssessmentAssignment.deleted_at.is_(None))
            )
        )).scalar_one()

        asmt_name = None
        if c.assessment_id:
            asmt = (await db.execute(select(Assessment).where(Assessment.id == c.assessment_id))).scalar_one_or_none()
            asmt_name = asmt.assessment_name if asmt else None

        events.append(CalendarEvent(
            id=c.uuid,
            title=c.campaign_name,
            campaign_code=c.campaign_code,
            status=c.status,
            start_date=c.start_date,
            end_date=c.end_date,
            assignment_count=count,
            assessment_name=asmt_name,
        ).model_dump())

    return success_response(data={"events": events, "total": len(events)})
