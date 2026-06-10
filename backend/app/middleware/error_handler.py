"""Global exception handler middleware — converts unhandled errors to standard error envelopes."""
import logging
import traceback

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("pase.errors")


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> JSONResponse:
        try:
            return await call_next(request)
        except ValueError as exc:
            logger.warning("Validation error: %s", exc)
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": str(exc), "errors": []},
            )
        except PermissionError as exc:
            return JSONResponse(
                status_code=403,
                content={"success": False, "message": str(exc), "errors": []},
            )
        except Exception as exc:
            logger.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "An internal server error occurred",
                    "errors": [],
                },
            )
