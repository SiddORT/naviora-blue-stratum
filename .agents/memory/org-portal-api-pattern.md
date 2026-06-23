---
name: Org portal API pattern
description: How org portal views and services make authenticated API calls, and the correct auth store import path for admin views.
---

## Rule — Org portal views
Each service file that serves the org portal defines a **local** `orgApi()` factory function — it is NOT exported from any shared module. Copy this pattern into every new org service file:

```ts
import api from "./api";
import { useOrgAuthStore } from "@/store/org-auth.store";

function orgApi() {
  const token = useOrgAuthStore.getState().accessToken;
  return {
    get:   (url: string, params?: object) => api.get(url,  { headers: { Authorization: `Bearer ${token}` }, params }),
    post:  (url: string, data?: object)   => api.post(url, data, { headers: { Authorization: `Bearer ${token}` } }),
    put:   (url: string, data?: object)   => api.put(url,  data, { headers: { Authorization: `Bearer ${token}` } }),
    patch: (url: string, data?: object)   => api.patch(url,data, { headers: { Authorization: `Bearer ${token}` } }),
    del:   (url: string)                  => api.delete(url,    { headers: { Authorization: `Bearer ${token}` } }),
  };
}
```

The response from `orgApi().get(...)` is a raw axios response; cast `res.data` manually or use an `unwrap()` helper.

## Rule — Admin views auth store import
Admin portal views import from `@/store/auth.store` (with a dot before "store"), **not** `@/store/authStore` (no dot). Using the wrong path causes a module-not-found build error in Turbopack.

```ts
import { useAuthStore } from "@/store/auth.store";  // correct
```

**Why:** The file is named `auth.store.ts` (dot-separated), matching the Zustand convention used throughout this codebase.
