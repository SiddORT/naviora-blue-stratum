"""
SecurityHeadersMiddleware — attaches HTTP security headers to every response.

Headers applied:
  X-Content-Type-Options     — prevent MIME sniffing
  X-Frame-Options            — prevent clickjacking
  X-XSS-Protection           — legacy XSS filter (belt-and-suspenders)
  Strict-Transport-Security  — force HTTPS (1 year + subdomains)
  Referrer-Policy            — limit referrer information leakage
  Permissions-Policy         — disable unnecessary browser features
  Content-Security-Policy    — restrict resource origins
  Cache-Control              — no-store for API responses
  Server                     — remove default server banner
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject HTTP security headers on every API response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Block framing (clickjacking protection)
        response.headers["X-Frame-Options"] = "DENY"

        # Legacy XSS filter
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Force HTTPS for 1 year, include subdomains
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Minimise referrer leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Disable camera, microphone, geolocation, payment
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # Content Security Policy — API-only backend; no frames or inline scripts
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; "
            "frame-ancestors 'none'; "
            "base-uri 'none';"
        )

        # No caching of API responses
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"

        # Remove/replace server header to avoid fingerprinting
        response.headers["Server"] = "Naviora"

        return response
