---
name: asyncpg SSL URL conversion
description: asyncpg rejects sslmode= query param; must be converted to ssl= at the config layer.
---

**Rule:** In `async_database_url`, replace `?sslmode=require` → `?ssl=require` and `&sslmode=require` → `&ssl=require`. Strip `sslmode=disable` entirely.

**Why:** asyncpg's `connect()` does not accept the `sslmode` keyword (a libpq/psycopg2 convention). Replit's `DATABASE_URL` appends `?sslmode=require`, causing `TypeError: connect() got an unexpected keyword argument 'sslmode'` at startup.

**How to apply:** Always do the conversion in the `async_database_url` property of `Settings` (config.py), not in session.py. The sync URL (psycopg2/Alembic) keeps `sslmode=` untouched.
