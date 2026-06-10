---
name: PASE Compass foundation stack decisions
description: Key architectural choices, ports, and seed credentials for the PASE Compass project.
---

**Stack:**
- Backend: FastAPI + SQLAlchemy 2.0 async (asyncpg) + Alembic + Pydantic v2 + JWT (python-jose)
- Frontend: Next.js 16 (App Router) + React 19 + Tailwind + TanStack Query + Zustand + RHF+Zod + Axios
- DB: PostgreSQL (Replit managed)

**Ports:** Backend :8000 (console workflow), Frontend :5000 (webview workflow).

**Proxy:** `next.config.ts` rewrites `/api/v1/*` → `http://127.0.0.1:8000/api/v1/*`.

**Seed super-admin:** `admin@pasecompass.com` / `Admin@2026!`

**Session management:** `get_db` dependency commits on success / rolls back on exception — services never call `commit()` directly.

**Token storage:** Refresh tokens stored as SHA-256 hashes in `refresh_tokens` table; raw JWT is never persisted.

**Brand palette:** primary #D4A63A/#B8860B, secondary #2EA8FF/#0A6DCC, bg #0B0B0F/#141821/#1E2430. No emojis in UI.
