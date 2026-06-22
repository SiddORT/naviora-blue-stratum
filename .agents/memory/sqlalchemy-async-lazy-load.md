---
name: SQLAlchemy async lazy loading
description: Accessing lazy-loaded relationships outside an explicit async context causes greenlet_spawn error. Must use selectinload after any commit/flush.
---

**Rule:** After `await db.commit()` or `await db.flush()`, never access lazy-loaded relationship attributes directly. SQLAlchemy async raises `greenlet_spawn has not been called` when lazy loads are triggered from sync code (e.g., inside a plain `def` helper that reads `model.relationship.field`).

**Why:** SQLAlchemy 2.0 async sessions do not support lazy loading by default — accessing an unloaded relationship attribute on an ORM model outside of an awaited IO call raises a greenlet error. This is silent until runtime and fails the whole request.

**How to apply:**
1. After any mutation that needs the full model back, reload with explicit `selectinload`:
   ```python
   await db.commit()
   q = select(Model).options(selectinload(Model.relation)).where(Model.id == row_id)
   row = (await db.execute(q)).scalar_one()
   return _to_response(row)
   ```
2. Never pass a post-`refresh()` object to a response helper that accesses relationships — `refresh()` only reloads columns, not relationships.
3. Keep a `_load_full(id)` helper per service that does the full selectinload reload for mutation endpoints.
4. The `list` and `get` endpoints are safe because they build the query with `selectinload` from the start.
