"""Standard success/error response builders used across all API endpoints."""
import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from fastapi.responses import JSONResponse


class _AppJSONEncoder(json.JSONEncoder):
    """JSON encoder that handles types Pydantic model_dump() can produce."""
    def default(self, obj: Any) -> Any:
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, UUID):
            return str(obj)
        # Pydantic models, dataclasses, enums, etc.
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "__dict__"):
            return obj.__dict__
        return super().default(obj)


def _to_json_safe(data: Any) -> Any:
    """
    Serialize `data` through our encoder then parse back so that
    Starlette's JSONResponse always receives native Python types.
    """
    return json.loads(json.dumps(data, cls=_AppJSONEncoder))


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200,
) -> JSONResponse:
    """
    Return a standardised success envelope.
    Shape: { "success": true, "message": "...", "data": { ... } }
    """
    return JSONResponse(
        status_code=status_code,
        content=_to_json_safe({
            "success": True,
            "message": message,
            "data": data,
        }),
    )


def error_response(
    message: str = "An error occurred",
    errors: Optional[list] = None,
    status_code: int = 400,
) -> JSONResponse:
    """
    Return a standardised error envelope.
    Shape: { "success": false, "message": "...", "errors": [ ... ] }
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "errors": errors or [],
        },
    )


def created_response(data: Any = None, message: str = "Record created successfully") -> JSONResponse:
    return success_response(data=data, message=message, status_code=201)


def not_found_response(resource: str = "Record") -> JSONResponse:
    return error_response(message=f"{resource} not found", status_code=404)


def forbidden_response(message: str = "You do not have permission to perform this action") -> JSONResponse:
    return error_response(message=message, status_code=403)


def unauthorized_response(message: str = "Authentication required") -> JSONResponse:
    return error_response(message=message, status_code=401)
