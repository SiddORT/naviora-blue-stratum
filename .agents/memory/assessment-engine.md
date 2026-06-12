---
name: Assessment Engine (Sprint 2.4)
description: Key decisions and conventions for the Assessment Management module — models, migration, API routes, frontend.
---

## Models
- `assessment_categories` — inherits `TimestampMixin`; `category_code` unique, uppercased
- `assessment_templates` — inherits `TimestampMixin`; FK to categories (SET NULL); has `version_number` incremented on each update
- `assessment_exercises` — plain `Base` junction (no TimestampMixin); `UniqueConstraint(assessment_id, exercise_id)`
- `assessment_rules` — inherits `TimestampMixin`; one-to-one with template (`unique=True` on `assessment_id`)
- `assessment_versions` — plain `Base`; manual `created_at` column using `_utcnow`; NOT soft-deletable

## Migration
- Revision `4f9d8af9060a`, chained from exercises migration `f360393c1ccb`
- Always set `down_revision` to the current head — running `alembic heads` reveals it

## API routes (prefix `/api/v1/assessments`)
- `/categories` — full CRUD + activate/deactivate + `/all-active`
- `/templates` — full CRUD + activate/deactivate + archive + clone + `/all-active` + `/{uuid}/versions`
- `/rules` — full CRUD (no activate/deactivate — rules aren't toggled independently)
- `/preview/{uuid}` — read-only full template + versions data

**Why:** `all-active` routes must be registered BEFORE `/{uuid}` routes in FastAPI or FastAPI matches "all-active" as a UUID.

## Sidebar Icons
`Tag`, `Map`, `Library`, `Target` were missing from Sidebar `iconMap` — added alongside existing icon imports.

## Seed Data
7 maritime assessment categories seeded: COLREG, PORT_OPS, EMRG, TSS, RESTR_VIS, MANOEUVRE, BRM.

## Frontend
- Service: `frontend/services/assessments.service.ts` using same `makeService<T>` factory as exercises
- Feature components: `CategoriesTable`, `RulesTable`, `TemplatesTable` (4-step wizard), `PreviewPage`
- Pages: `/admin/assessments/` (index), `/categories`, `/templates`, `/rules`, `/preview?uuid=...`
- Navigation: Assessment Management now has 3 children (Categories, Templates, Rules)
- Template wizard: step 0 → meta, step 1 → exercise picker with weightage/mandatory/sequence, step 2 → rules, step 3 → review & save
- Preview page uses `useSearchParams()` + `Suspense` wrapper (required for client-side search params in Next.js App Router)
