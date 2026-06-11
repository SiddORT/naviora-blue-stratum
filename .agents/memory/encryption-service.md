---
name: Encryption Service
description: Field-level AES-256-GCM encryption for sensitive DB columns; key rotation rules and wiring pattern.
---

# Encryption Service

`backend/app/services/encryption.py` — module-level singleton `encryption_service`.

## Rule
Encrypt `api_key` and `client_secret` in `simulator_configurations` (and any future sensitive fields) at the **service layer**, not the repository or model layer. The encrypted token is stored in the DB column; the service decrypts on read.

**Why:** Columns are VARCHAR — no schema change needed. The service owns the encrypt/decrypt lifecycle, so the repo stays generic.

## How to apply
- On write: call `encryption_service.encrypt(value)` before passing to the repo dict.
- On read: call `encryption_service.decrypt_if_present(column_value)` in `_to_response()`.
- Never include encrypted fields in audit `old_values`/`new_values` or list responses.
- Use `encryption_service.hash()` + `verify()` for tokens that must be searchable (HMAC-SHA256, not AES).

## Key constraint
`ENCRYPTION_KEY` must **never change** after data is written — all existing ciphertext becomes unreadable. It is stored as a Replit Secret (64 hex chars = 32 bytes). The service falls back to `SESSION_SECRET` with a loud warning if `ENCRYPTION_KEY` is absent, but this must never happen in production.

## Encrypted format
`base64url( 12-byte-nonce || AES-GCM-ciphertext )` — authenticated; any tamper raises `ValueError`.
