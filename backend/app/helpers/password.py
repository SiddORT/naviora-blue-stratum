"""
Password complexity helpers.

Rules enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character (!@#$%^&*…)
  - No whitespace
  - Not in common-password shortlist

Usage:
    from app.helpers.password import validate_password_strength, PasswordStrengthError

    try:
        validate_password_strength("MyPass123!")
    except PasswordStrengthError as e:
        print(e.errors)  # list of human-readable failures
"""
import re
from dataclasses import dataclass, field

# Short-list of the most commonly used weak passwords
_COMMON_PASSWORDS = frozenset({
    "password", "password1", "password123", "123456", "12345678",
    "qwerty", "letmein", "welcome", "admin", "admin123",
    "iloveyou", "sunshine", "princess", "football", "monkey",
    "dragon", "master", "abc123", "passw0rd", "p@ssword",
})

_SPECIAL_CHARS = r"!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~"
_SPECIAL_RE = re.compile(rf"[{_SPECIAL_CHARS}]")


class PasswordStrengthError(ValueError):
    """Raised when a password does not meet complexity requirements."""

    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__("; ".join(errors))


def validate_password_strength(password: str) -> None:
    """
    Validate password complexity.
    Raises PasswordStrengthError with a list of failures if the password
    does not meet all requirements.
    """
    errors: list[str] = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")

    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")

    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")

    if not re.search(r"\d", password):
        errors.append("Password must contain at least one digit")

    if not _SPECIAL_RE.search(password):
        errors.append("Password must contain at least one special character")

    if re.search(r"\s", password):
        errors.append("Password must not contain whitespace")

    if password.lower() in _COMMON_PASSWORDS:
        errors.append("Password is too common — choose a more unique password")

    if errors:
        raise PasswordStrengthError(errors)


def password_strength_score(password: str) -> int:
    """
    Return a 0–5 score indicating password strength.
    Useful for frontend strength meters.
    """
    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if re.search(r"[A-Z]", password) and re.search(r"[a-z]", password):
        score += 1
    if re.search(r"\d", password):
        score += 1
    if _SPECIAL_RE.search(password):
        score += 1
    return score
