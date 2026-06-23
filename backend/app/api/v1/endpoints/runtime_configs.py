"""Admin — Runtime Configuration CRUD endpoints."""
import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser, require_admin
from app.helpers.pagination import PaginatedResponse
from app.models.runtime_configuration import RuntimeConfiguration
from app.models.simulator_vendor import SimulatorVendor
from app.schemas.sessions import RuntimeConfigCreate, RuntimeConfigResponse, RuntimeConfigUpdate
from app.services.audit import AuditService
from app.utils.responses import created_response, not_found_response, success_response

router = APIRouter()


async def _load(uuid: str, db: AsyncSession) -> RuntimeConfiguration | None:
    result = await db.execute(
        select(RuntimeConfiguration).where(
            and_(RuntimeConfiguration.uuid == uuid, RuntimeConfiguration.deleted_at.is_(None))
        )
    )
    return result.scalar_one_or_none()


def _to_response(rc: RuntimeConfiguration, vendor: SimulatorVendor | None = None) -> dict:
    return {
        "id": rc.id,
        "uuid": rc.uuid,
        "simulator_vendor_id": rc.simulator_vendor_id,
        "vendor_name": vendor.name if vendor else None,
        "vendor_code": vendor.code if vendor else None,
        "config_name": rc.config_name,
        "runtime_mode": rc.runtime_mode,
        "api_endpoint": rc.api_endpoint,
        "executable_path": rc.executable_path,
        "working_directory": rc.working_directory,
        "launch_arguments": rc.launch_arguments,
        "result_directory": rc.result_directory,
        "auto_sync": rc.auto_sync,
        "is_default": rc.is_default,
        "notes": rc.notes,
        "status": rc.status,
        "created_at": rc.created_at.isoformat(),
        "updated_at": rc.updated_at.isoformat(),
    }


@router.get("", summary="List runtime configurations")
async def list_runtime_configs(
    _: None = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vendor_id: int | None = Query(None),
    mode: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(RuntimeConfiguration).where(RuntimeConfiguration.deleted_at.is_(None))
    if vendor_id:
        base_q = base_q.where(RuntimeConfiguration.simulator_vendor_id == vendor_id)
    if mode:
        base_q = base_q.where(RuntimeConfiguration.runtime_mode == mode)

    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar_one()
    rows = (await db.execute(
        base_q.order_by(RuntimeConfiguration.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    vendor_ids = list({r.simulator_vendor_id for r in rows})
    vendors: dict[int, SimulatorVendor] = {}
    if vendor_ids:
        v_rows = (await db.execute(select(SimulatorVendor).where(SimulatorVendor.id.in_(vendor_ids)))).scalars().all()
        vendors = {v.id: v for v in v_rows}

    items = [_to_response(r, vendors.get(r.simulator_vendor_id)) for r in rows]
    return success_response(
        data=PaginatedResponse(
            items=items, total=total, page=page, page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        ).model_dump()
    )


@router.post("", summary="Create runtime configuration")
async def create_runtime_config(
    body: RuntimeConfigCreate,
    current_user: CurrentUser,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    vendor = await db.get(SimulatorVendor, body.simulator_vendor_id)
    if not vendor:
        return not_found_response("Simulator Vendor")

    # Unset existing default for same vendor+mode if this one is default
    if body.is_default:
        existing = (await db.execute(
            select(RuntimeConfiguration).where(
                and_(
                    RuntimeConfiguration.simulator_vendor_id == body.simulator_vendor_id,
                    RuntimeConfiguration.runtime_mode == body.runtime_mode,
                    RuntimeConfiguration.is_default == True,  # noqa: E712
                    RuntimeConfiguration.deleted_at.is_(None),
                )
            )
        )).scalars().all()
        for e in existing:
            e.is_default = False

    rc = RuntimeConfiguration(**body.model_dump(), created_by=current_user.uuid)
    db.add(rc)
    await db.commit()
    await db.refresh(rc)

    audit = AuditService(db)
    await audit.log("simulators", "runtime_config.created", current_user.uuid,
                    "RuntimeConfiguration", str(rc.id), body.model_dump())

    return created_response(data=_to_response(rc, vendor), message="Runtime configuration created")


@router.get("/{uuid}", summary="Get runtime configuration")
async def get_runtime_config(
    uuid: str,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rc = await _load(uuid, db)
    if not rc:
        return not_found_response("Runtime Configuration")
    vendor = await db.get(SimulatorVendor, rc.simulator_vendor_id)
    return success_response(data=_to_response(rc, vendor))


@router.put("/{uuid}", summary="Update runtime configuration")
async def update_runtime_config(
    uuid: str,
    body: RuntimeConfigUpdate,
    current_user: CurrentUser,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rc = await _load(uuid, db)
    if not rc:
        return not_found_response("Runtime Configuration")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(rc, field, value)
    rc.updated_by = current_user.uuid
    await db.commit()
    await db.refresh(rc)

    vendor = await db.get(SimulatorVendor, rc.simulator_vendor_id)
    return success_response(data=_to_response(rc, vendor), message="Updated")


@router.delete("/{uuid}", summary="Delete runtime configuration")
async def delete_runtime_config(
    uuid: str,
    current_user: CurrentUser,
    _: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rc = await _load(uuid, db)
    if not rc:
        return not_found_response("Runtime Configuration")

    rc.soft_delete(current_user.uuid)
    await db.commit()
    return success_response(message="Deleted")
