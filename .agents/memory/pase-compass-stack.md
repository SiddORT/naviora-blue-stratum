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

**Brand palette:** primary #D4A63A/#B8860B, secondary #2EA8FF/#0A6DCC. No emojis in UI.
**Theme palettes:**
- Dark mode: deep navy bg (#080818 / HSL 240 52% 7%) → simulator-matched. Surface #101030. Warm off-white text (#F0ECD8).
- Light mode: nautical parchment (#FAFAF5 bg, #F2EDE0 surface, deep navy #0D0D2A as text color).
- Extra CSS vars available: --sim-navy, --sim-maroon, --sim-gold, --sim-gold-bright, --sim-green, --sim-olive, --sim-inactive.
- Utility classes: `.gradient-simulator` (navy→maroon), `.gradient-simulator-light`, `.tier-green`, `.tier-olive`, `.tier-inactive`.
