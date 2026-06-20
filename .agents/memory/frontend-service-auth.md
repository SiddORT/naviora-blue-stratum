---
name: Frontend Service Auth
description: All frontend API services must use the shared axios instance, not raw fetch — Bearer token is attached via interceptor from Zustand store.
---

# Frontend Service Auth Pattern

**Rule:** Every frontend service file must import and use `api` from `services/api.ts` (axios), not raw `fetch`.

**Why:** The app authenticates via Bearer token stored in Zustand (`useAuthStore.accessToken`). The `api` axios instance has a request interceptor that attaches `Authorization: Bearer <token>` to every call automatically. Raw `fetch` with `credentials: "include"` sends cookies, but the backend uses `HTTPBearer` (Authorization header only) — cookies are never checked. Result: raw fetch always 401s on protected endpoints.

**How to apply:** When writing any new frontend service, always start with:
```ts
import api from "./api";
```
Then use `api.get(...)`, `api.post(...)`, etc. The interceptor also handles 401 token refresh automatically.

The `api` instance lives at `frontend/services/api.ts`.
