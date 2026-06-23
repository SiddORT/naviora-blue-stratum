"""Candidate Portal — Activity timeline endpoint."""
import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.candidate_auth import CurrentCandidate
from app.models.assessment_assignment import AssessmentAssignment
from app.models.assignment_activity_log import AssignmentActivityLog
from app.utils.responses import success_response

router = APIRouter()

ACTIVITY_ICONS: dict[str, str] = {
    "Assignment Created": "ClipboardList",
    "Assignment Started": "PlayCircle",
    "Assignment Completed": "CheckCircle",
    "Check-In Completed": "ShieldCheck",
    "Rules Accepted": "FileCheck",
    "Session Created": "Server",
    "Session Launched": "Rocket",
    "Session Completed": "CheckSquare",
    "Certificate Issued": "Award",
}


@router.get("", summary="Candidate activity timeline")
async def get_activity(
    candidate: CurrentCandidate,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    assignment_ids_result = await db.execute(
        select(AssessmentAssignment.id).where(
            and_(
                AssessmentAssignment.candidate_id == candidate.id,
                AssessmentAssignment.deleted_at.is_(None),
            )
        )
    )
    assignment_ids = [r[0] for r in assignment_ids_result.fetchall()]

    if not assignment_ids:
        return success_response({
            "items": [], "total": 0, "page": page, "page_size": page_size, "pages": 0,
        })

    count_q = select(AssignmentActivityLog).where(
        AssignmentActivityLog.assignment_id.in_(assignment_ids)
    )
    total = (await db.execute(
        select(__import__('sqlalchemy').func.count()).select_from(count_q.subquery())
    )).scalar_one()

    rows = (await db.execute(
        select(AssignmentActivityLog).where(
            AssignmentActivityLog.assignment_id.in_(assignment_ids)
        )
        .order_by(AssignmentActivityLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )).scalars().all()

    items = [
        {
            "id": r.id,
            "assignment_id": r.assignment_id,
            "activity_type": r.activity_type,
            "activity_description": r.activity_description,
            "icon": ACTIVITY_ICONS.get(r.activity_type, "Activity"),
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]

    return success_response({
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    })
