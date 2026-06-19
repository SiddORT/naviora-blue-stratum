---
name: Sidebar nav keys
description: React key collision when multiple nav children share the same href
---

The Sidebar maps `ADMIN_NAV_ITEMS` with `key={item.href}`. When a nav group has
children that all point to the same path (e.g. all link to `/admin/assessments`),
React throws a duplicate-key warning and may skip or duplicate items.

**Why:** Per-assessment sub-pages (participants, schedule, progress) live under
`/admin/assessments/[id]/…` rather than a fixed path, so parent nav children
all shared the same href.

**How to apply:** Always key nav items with a composite: `key={\`${item.href}::${item.label}\`}`.
Applied to both top-level items and nested children in `Sidebar.tsx`.
