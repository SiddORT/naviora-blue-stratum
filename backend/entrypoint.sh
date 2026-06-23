#!/bin/sh
set -e

echo "=== Naviora API startup ==="

echo "--- Running Alembic migrations ---"
alembic upgrade head

echo "--- Seeding database ---"
python /app/seed.py

echo "--- Starting API server on port 8001 ---"
exec uvicorn main:app --host 0.0.0.0 --port 8001 --workers 2 --log-level info