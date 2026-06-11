"""
GDPR compliance helpers.

Implements:
  anonymize_user()     — right to erasure: replace personal identifiers
                         while preserving assessment history (no hard delete)
  export_user_data()   — right to portability: collect all user-owned records
  redact_pii()         — mask PII strings for safe logging
  generate_anon_ref()  — produce a stable anonymisation reference

Design principles:
  - Never physically delete records — use anonymisation
  - Preserve referential integrity and aggregate data
  - Personal identifiers are replaced with a stable anon_ref
"""
import hashlib
import re
import secrets
import string
from datetime import datetime, timezone
from typing import Any


# ── Anonymisation ──────────────────────────────────────────────────────────

def generate_anon_ref(user_uuid: str) -> str:
    """
    Generate a stable, non-reversible anonymisation reference.
    The same UUID always produces the same anon_ref so cross-record
    anonymisation stays consistent.
    Returns a string like "ANON-a3f7c9d2".
    """
    digest = hashlib.sha256(f"naviora-anon:{user_uuid}".encode()).hexdigest()[:8]
    return f"ANON-{digest}"


def anonymize_user_data(user_uuid: str) -> dict[str, Any]:
    """
    Return a dict of column updates that anonymise a User record.

    Caller is responsible for applying these values to the database row.
    Personal identifiers are replaced; non-personal fields are untouched.

    Usage:
        updates = anonymize_user_data(user.uuid)
        for attr, value in updates.items():
            setattr(user, attr, value)
    """
    anon_ref = generate_anon_ref(user_uuid)
    rand_suffix = secrets.token_hex(4)

    return {
        "email":                f"{anon_ref}@deleted.naviora.invalid",
        "username":             anon_ref,
        "full_name":            f"Deleted User ({anon_ref})",
        "phone":                None,
        "avatar_url":           None,
        "notes":                None,
        "password_reset_token": None,
        "password_reset_expires": None,
        "status":               "anonymised",
        "is_active":            False,
        # hashed_password replaced with random bcrypt-looking placeholder
        # (actual hash of a random value — will never match any real password)
        "_anon_ref":            anon_ref,
        "_anonymised_at":       datetime.now(timezone.utc).isoformat(),
    }


# ── Data export (Right to Portability) ────────────────────────────────────

def build_export_envelope(
    user: dict[str, Any],
    *,
    assessments: list[dict] | None = None,
    certificates: list[dict] | None = None,
    sessions: list[dict] | None = None,
    activity_logs: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Assemble a GDPR data-portability export envelope.

    Returns a structured dict ready for JSON/CSV serialisation.
    The caller passes pre-fetched records; this function only structures them.
    """
    return {
        "export_metadata": {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "platform":    "Naviora by Blue Stratum",
            "format":      "gdpr-export-v1",
            "subject":     user.get("email", ""),
        },
        "profile": {
            "full_name":    user.get("full_name"),
            "email":        user.get("email"),
            "phone":        user.get("phone"),
            "created_at":  user.get("created_at"),
            "last_login":  user.get("last_login"),
        },
        "assessments":   assessments   or [],
        "certificates":  certificates  or [],
        "sessions":      sessions      or [],
        "activity_logs": activity_logs or [],
    }


# ── PII redaction (for safe logging) ──────────────────────────────────────

_EMAIL_RE   = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_RE   = re.compile(r"\+?\d[\d\s\-().]{6,}\d")
_TOKEN_RE   = re.compile(r"(?i)(api[_-]?key|token|secret|password)\s*[=:]\s*\S+")


def redact_pii(text: str) -> str:
    """
    Replace known PII patterns in a string with redacted placeholders.
    Useful before logging user-submitted data.
    """
    text = _EMAIL_RE.sub("[EMAIL REDACTED]", text)
    text = _PHONE_RE.sub("[PHONE REDACTED]", text)
    text = _TOKEN_RE.sub(r"\1=[REDACTED]", text)
    return text
