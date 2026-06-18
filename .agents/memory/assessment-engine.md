---
name: Assessment Engine (Refactored)
description: Key decisions and conventions for the Assessment Management module — new unified Assessment model replacing old category/template/rule structure.
---

## Models (current — post-refactor)
- `assessments` — inherits `TimestampMixin`; `assessment_code` unique uppercased; `status` = draft/active/archived; `assessment_type` = Training/Evaluation/Certification/Practice
- `assessment_exercises` — plain `Base` junction (no TimestampMixin); FK to `assessments.id` (NOT templates); `UniqueConstraint(assessment_id, exercise_id)`
- `assessment_participants` — plain `Base` with manual timestamps; FK to `assessments.id` + nullable `users.id`
- `assessment_schedules` — plain `Base` with manual timestamps; one-per-assessment (upsert pattern)
- `assessment_results` — placeholder; FK to `assessments.id` + nullable `assessment_participants.id`

**Removed models:** assessment_categories, assessment_templates, assessment_rules, assessment_versions

## Migration
- Old revision `4f9d8af9060a` — old 5-table structure (now dropped)
- Refactor revision `b9e0f1a2c3d4` (down_revision `4f9d8af9060a`) — drops old tables, creates new 5 tables
- Migration ran successfully June 2026

## API routes (prefix `/api/v1/assessments`)
- `GET/POST /assessments` — list (paginated) + create
- `GET /assessments/all-active` — MUST be before `/{uuid}` route or FastAPI matches it as UUID
- `GET/PUT/DELETE /assessments/{uuid}` — single assessment CRUD
- `PATCH /assessments/{uuid}/activate` — draft → active
- `PATCH /assessments/{uuid}/archive` — active → archived
- `GET/PUT /assessments/{uuid}/schedule` — upsert schedule
- `GET/POST /assessments/{uuid}/participants` — participants

**Why:** `all-active` before `/{uuid}` is critical — FastAPI greedily matches path params.

## Frontend
- Service: `frontend/services/assessments.service.ts` — flat `assessmentService` object (not factory pattern)
- Types: `frontend/types/assessment.types.ts` — `Assessment`, `AssessmentListItem`, `AssessmentPage`, `AssessmentSchedule`, etc.
- Feature components: `AssessmentList` (table with search/type/status filter), `AssessmentBuilder` (5-step wizard: Info → Exercises → Settings → Schedule → Review)
- Pages: `/admin/assessments` (list), `/admin/assessments/builder?uuid=...` (create/edit)
- Navigation: single flat "Assessment Management" entry (no children) pointing to `/admin/assessments`
- Builder uses `useSearchParams()` inside `<Suspense>` wrapper (required for App Router)
- Toast: import `toast` directly from `@/hooks/use-toast` (NOT destructured from `useToast()`)

## Vessel Type Add Button
- `BASE_VESSEL_TYPES` constant array (no "Custom" sentinel)
- `[sessionTypes, setSessionTypes]` state holds runtime-added types
- `allVesselTypes = [...BASE_VESSEL_TYPES, ...sessionTypes]` drives both filter dropdown and form select
- "+" button toggles `addTypeOpen` state; inline input adds to `sessionTypes` and auto-selects via `setValue`
- When editing a vessel with a non-standard type, it's auto-added to `sessionTypes` in the `useEffect`
