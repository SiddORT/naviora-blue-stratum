---
name: DB seed via psql
description: How to safely insert seed/fix data into the Naviora DB, and the exact schema of permissions/role_permissions tables.
---

## Rule
Always use `psql "$DATABASE_URL" << 'EOF' ... EOF` for ad-hoc seed or fix SQL. Standalone asyncpg scripts fail because the DATABASE_URL contains `?ssl=` which asyncpg handles differently from the app's config layer.

**Why:** Direct asyncpg connections outside the app fail with SSL rejection errors on the Replit-managed PostgreSQL instance.

## permissions table required columns
- `uuid` (varchar 36, unique)
- `name` (varchar 150, unique)
- `slug` (varchar 150, unique, not null)
- `module` (varchar 100, not null)
- `action` (varchar 100, not null)
- `description` (text, nullable)

## role_permissions table
- No `uuid` column — primary key is `id` (serial)
- Unique constraint: `uq_role_permission` on `(role_id, permission_id)`
- `scope` column defaults to `'ALL'`
- ON CONFLICT: `ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING`

## Pattern to assign a new permission to all roles that already have a related one
```sql
INSERT INTO permissions (uuid, name, slug, module, action, description)
VALUES (gen_random_uuid(), 'module.action', 'module.action', 'module', 'action', 'Description')
ON CONFLICT (name) DO NOTHING;

WITH perm AS (SELECT id FROM permissions WHERE name = 'module.action')
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT rp.role_id, perm.id, 'ALL'
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
CROSS JOIN perm
WHERE p.name = 'module.existing_permission'
ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING;
```
