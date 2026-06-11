"""
EncryptionService — AES-256-GCM field-level encryption for sensitive data at rest.

Usage:
    from app.services.encryption import encryption_service

    ciphertext = encryption_service.encrypt("my-api-key")
    plaintext  = encryption_service.decrypt(ciphertext)
    digest     = encryption_service.hash("value")
    ok         = encryption_service.verify("value", digest)

Encrypted format: base64url( 12-byte-nonce || AES-GCM-ciphertext )
"""
import base64
import hashlib
import hmac
import logging
import os
import secrets

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

logger = logging.getLogger(__name__)

_NONCE_SIZE = 12  # 96-bit nonce — recommended for AES-GCM


def _derive_key(raw: str) -> bytes:
    """
    Derive a 32-byte (256-bit) key from the raw secret string.
    Uses SHA-256 so any string length becomes a valid AES-256 key.
    """
    return hashlib.sha256(raw.encode("utf-8")).digest()


class EncryptionService:
    """AES-256-GCM authenticated encryption + HMAC-SHA-256 hashing."""

    def __init__(self, key_hex: str | None = None) -> None:
        raw = key_hex or os.environ.get("ENCRYPTION_KEY", "")
        if not raw:
            # Fall back to SESSION_SECRET — still secure, but warn loudly
            fallback = os.environ.get("SESSION_SECRET", "dev-fallback-insecure")
            logger.warning(
                "ENCRYPTION_KEY not set — falling back to SESSION_SECRET. "
                "Set ENCRYPTION_KEY in production!"
            )
            raw = fallback
        self._key: bytes = _derive_key(raw)
        self._aesgcm = AESGCM(self._key)

    # ── Symmetric encryption ───────────────────────────────────────────────

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string.
        Returns a base64url-encoded string of (nonce || ciphertext).
        Returns empty string if plaintext is empty.
        """
        if not plaintext:
            return ""
        nonce = os.urandom(_NONCE_SIZE)
        ct = self._aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        return base64.urlsafe_b64encode(nonce + ct).decode("utf-8")

    def decrypt(self, token: str) -> str:
        """
        Decrypt a base64url-encoded token produced by encrypt().
        Returns empty string if token is empty.
        Raises ValueError if the token is invalid or tampered.
        """
        if not token:
            return ""
        try:
            data = base64.urlsafe_b64decode(token.encode("utf-8"))
            nonce, ct = data[:_NONCE_SIZE], data[_NONCE_SIZE:]
            return self._aesgcm.decrypt(nonce, ct, None).decode("utf-8")
        except Exception as exc:
            raise ValueError("Decryption failed — token is invalid or tampered") from exc

    def is_encrypted(self, value: str) -> bool:
        """
        Heuristic check — does this look like an encrypted token?
        Encrypted tokens are base64url-encoded and at least 17 bytes decoded.
        """
        if not value:
            return False
        try:
            decoded = base64.urlsafe_b64decode(value.encode("utf-8") + b"==")
            return len(decoded) > _NONCE_SIZE
        except Exception:
            return False

    # ── HMAC hashing (for non-password values) ────────────────────────────

    def hash(self, value: str) -> str:
        """
        Produce a keyed HMAC-SHA-256 digest of value.
        Suitable for storing tokens or reference IDs that must be searchable.
        Returns a 64-char hex string.
        """
        return hmac.new(self._key, value.encode("utf-8"), hashlib.sha256).hexdigest()

    def verify(self, value: str, digest: str) -> bool:
        """
        Constant-time comparison of value against a stored HMAC-SHA-256 digest.
        """
        expected = self.hash(value)
        return hmac.compare_digest(expected, digest)

    # ── Convenience helpers ───────────────────────────────────────────────

    def encrypt_if_present(self, value: str | None) -> str | None:
        """Encrypt value only if it is non-null and non-empty."""
        if not value:
            return value
        return self.encrypt(value)

    def decrypt_if_present(self, token: str | None) -> str | None:
        """Decrypt token only if it is non-null and non-empty."""
        if not token:
            return token
        return self.decrypt(token)


# Module-level singleton — safe to import anywhere
encryption_service = EncryptionService()
