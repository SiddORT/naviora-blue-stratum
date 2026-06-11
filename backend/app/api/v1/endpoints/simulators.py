"""Simulator Integration Hub — API endpoints for vendors, configurations, sessions, logs."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import CurrentUser
from app.dependencies.permissions import check_permissions
from app.helpers.pagination import PaginatedResponse
from app.schemas.simulator import (
    SimulatorConfigurationCreate,
    SimulatorConfigurationListResponse,
    SimulatorConfigurationUpdate,
    SimulatorSessionListResponse,
    SimulatorVendorCreate,
    SimulatorVendorListResponse,
    SimulatorVendorUpdate,
    IntegrationLogListResponse,
)
from app.services.integration_log import IntegrationLogService
from app.services.simulator_configuration import SimulatorConfigurationService
from app.services.simulator_session import SimulatorSessionService
from app.services.simulator_vendor import SimulatorVendorService
from app.utils.responses import (
    created_response,
    error_response,
    not_found_response,
    success_response,
)

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Simulator Vendors
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/vendors",
    summary="List simulator vendors (paginated)",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def list_vendors(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    integration_type: Optional[str] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    service = SimulatorVendorService(db)
    items, total = await service.list_vendors(
        page=page, page_size=page_size, search=search,
        status=status, integration_type=integration_type,
        sort_by=sort_by, sort_order=sort_order,
    )
    resp = PaginatedResponse[SimulatorVendorListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/vendors/{uuid}",
    summary="Get simulator vendor by UUID",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def get_vendor(uuid: str, db: AsyncSession = Depends(get_db)):
    service = SimulatorVendorService(db)
    vendor = await service.get_vendor(uuid)
    if not vendor:
        return not_found_response("Simulator Vendor")
    return success_response(data=vendor.model_dump())


@router.post(
    "/vendors",
    summary="Create simulator vendor",
    dependencies=[Depends(check_permissions(["simulators.create"]))],
)
async def create_vendor(
    body: SimulatorVendorCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = SimulatorVendorService(db)
    try:
        vendor = await service.create_vendor(body, created_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    return created_response(data=vendor.model_dump(), message="Simulator vendor created successfully")


@router.put(
    "/vendors/{uuid}",
    summary="Update simulator vendor",
    dependencies=[Depends(check_permissions(["simulators.edit"]))],
)
async def update_vendor(
    uuid: str,
    body: SimulatorVendorUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = SimulatorVendorService(db)
    try:
        vendor = await service.update_vendor(uuid, body, updated_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    if not vendor:
        return not_found_response("Simulator Vendor")
    return success_response(data=vendor.model_dump(), message="Simulator vendor updated successfully")


@router.delete(
    "/vendors/{uuid}",
    summary="Soft-delete simulator vendor",
    dependencies=[Depends(check_permissions(["simulators.delete"]))],
)
async def delete_vendor(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = SimulatorVendorService(db)
    ok = await service.delete_vendor(uuid, deleted_by_uuid=current_user.uuid)
    if not ok:
        return not_found_response("Simulator Vendor")
    return success_response(message="Simulator vendor deleted successfully")


# ─────────────────────────────────────────────────────────────────────────────
# Simulator Configurations
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/configurations",
    summary="List simulator configurations (paginated)",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def list_configurations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    authentication_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    simulator_vendor_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = SimulatorConfigurationService(db)
    items, total = await service.list_configurations(
        page=page, page_size=page_size, search=search,
        authentication_type=authentication_type, status=status,
        simulator_vendor_id=simulator_vendor_id,
    )
    resp = PaginatedResponse[SimulatorConfigurationListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/configurations/{uuid}",
    summary="Get simulator configuration by UUID",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def get_configuration(uuid: str, db: AsyncSession = Depends(get_db)):
    service = SimulatorConfigurationService(db)
    config = await service.get_configuration(uuid)
    if not config:
        return not_found_response("Simulator Configuration")
    return success_response(data=config.model_dump())


@router.post(
    "/configurations",
    summary="Create simulator configuration",
    dependencies=[Depends(check_permissions(["simulators.create"]))],
)
async def create_configuration(
    body: SimulatorConfigurationCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = SimulatorConfigurationService(db)
    try:
        config = await service.create_configuration(body, created_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    return created_response(data=config.model_dump(), message="Simulator configuration created successfully")


@router.put(
    "/configurations/{uuid}",
    summary="Update simulator configuration",
    dependencies=[Depends(check_permissions(["simulators.edit"]))],
)
async def update_configuration(
    uuid: str,
    body: SimulatorConfigurationUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = SimulatorConfigurationService(db)
    try:
        config = await service.update_configuration(uuid, body, updated_by_uuid=current_user.uuid)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    if not config:
        return not_found_response("Simulator Configuration")
    return success_response(data=config.model_dump(), message="Simulator configuration updated successfully")


@router.delete(
    "/configurations/{uuid}",
    summary="Soft-delete simulator configuration",
    dependencies=[Depends(check_permissions(["simulators.delete"]))],
)
async def delete_configuration(uuid: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    service = SimulatorConfigurationService(db)
    ok = await service.delete_configuration(uuid, deleted_by_uuid=current_user.uuid)
    if not ok:
        return not_found_response("Simulator Configuration")
    return success_response(message="Simulator configuration deleted successfully")


# ─────────────────────────────────────────────────────────────────────────────
# Simulator Sessions (read-only)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/sessions",
    summary="List simulator sessions (paginated, read-only)",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def list_sessions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    simulator_vendor_id: Optional[int] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    service = SimulatorSessionService(db)
    items, total = await service.list_sessions(
        page=page, page_size=page_size, search=search,
        status=status, simulator_vendor_id=simulator_vendor_id,
        sort_by=sort_by, sort_order=sort_order,
    )
    resp = PaginatedResponse[SimulatorSessionListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/sessions/{uuid}",
    summary="Get simulator session by UUID",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def get_session(uuid: str, db: AsyncSession = Depends(get_db)):
    service = SimulatorSessionService(db)
    session = await service.get_session(uuid)
    if not session:
        return not_found_response("Simulator Session")
    return success_response(data=session.model_dump())


# ─────────────────────────────────────────────────────────────────────────────
# Integration Logs (read-only)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/logs",
    summary="List integration logs (paginated, read-only)",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def list_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    simulator_vendor_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = IntegrationLogService(db)
    items, total = await service.list_logs(
        page=page, page_size=page_size, search=search,
        status=status, simulator_vendor_id=simulator_vendor_id,
    )
    resp = PaginatedResponse[IntegrationLogListResponse](
        items=items, page=page, page_size=page_size,
        total=total, total_pages=max(1, math.ceil(total / page_size)),
    )
    return success_response(data=resp.model_dump())


@router.get(
    "/logs/{uuid}",
    summary="Get integration log by UUID",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def get_log(uuid: str, db: AsyncSession = Depends(get_db)):
    service = IntegrationLogService(db)
    log = await service.get_log(uuid)
    if not log:
        return not_found_response("Integration Log")
    return success_response(data=log.model_dump())


# ─────────────────────────────────────────────────────────────────────────────
# Connection Testing
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/configurations/{uuid}/test",
    summary="Test simulator connection",
    dependencies=[Depends(check_permissions(["simulators.view"]))],
)
async def test_connection(uuid: str, db: AsyncSession = Depends(get_db)):
    from app.adapters import get_adapter

    service = SimulatorConfigurationService(db)
    config = await service.get_configuration(uuid)
    if not config:
        return not_found_response("Simulator Configuration")

    vendor_code = config.vendor_code or "CUSTOM"
    adapter_cls = get_adapter(vendor_code)
    adapter = adapter_cls(config.model_dump())
    result = await adapter.test_connection()
    return success_response(data=result, message="Connection test completed")
