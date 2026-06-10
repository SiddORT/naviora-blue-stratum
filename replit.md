# PASE Compass by Blue Stratum

Enterprise-grade maritime assessment, simulation, competency, certification, and reporting SaaS platform.

## Architecture

- **Frontend**: Next.js 15 (App Router) on port 5000 — served via `cd frontend && npm run dev`
- **Backend**: FastAPI on port 8000 — served via `cd backend && python main.py`
- **Database**: PostgreSQL (Replit-managed, DATABASE_URL env var)
- **Proxy**: Next.js rewrites `/api/v1/*` → `http://127.0.0.1:8000/api/v1/*`

## Stack

Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query v5, Zustand, React Hook Form, Zod, Lucide Icons

Backend: FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, JWT (python-jose), passlib/bcrypt

## Running the App

Both workflows run together:
- **Start application** (webview:5000) — Next.js frontend
- **Backend API** (console:8000) — FastAPI backend

Migrations: `cd backend && alembic upgrade head`
Seed data: `cd backend && python seed.py`

## Default Credentials

Super Admin: admin@pasecompass.com / Admin@2026!

## User Preferences

- No emojis in UI
- Dark theme only (brand palette: primary #D4A63A/#B8860B, secondary #2EA8FF/#0A6DCC, backgrounds #0B0B0F/#141821/#1E2430)
- No placeholder architecture — production-ready only
- Stack is non-negotiable: Next.js 15 + FastAPI + PostgreSQL
